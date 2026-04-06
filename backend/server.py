from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import time
import cloudinary
import cloudinary.utils

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
    secure=True
)

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Helper Functions ============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============ Models ============

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = Field(..., pattern="^(buyer|seller)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    city: str
    location: str
    land_size: float
    images: List[str]

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    city: Optional[str] = None
    location: Optional[str] = None
    land_size: Optional[float] = None
    images: Optional[List[str]] = None

class ListingResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    city: str
    location: str
    land_size: float
    images: List[str]
    status: str
    seller_id: str
    seller_name: str
    seller_email: str
    created_at: str

class MessageCreate(BaseModel):
    listing_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    listing_id: str
    listing_title: str
    sender_id: str
    sender_name: str
    sender_email: str
    message: str
    created_at: str

# ============ Startup Event ============

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.listings.create_index("seller_id")
    await db.listings.create_index("status")
    await db.listings.create_index("city")
    await db.messages.create_index("listing_id")
    await db.messages.create_index("sender_id")
    await db.login_attempts.create_index("identifier")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@landplatform.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

# ============ Auth Routes ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(user_data.password)
    
    user_doc = {
        "name": user_data.name,
        "email": email,
        "password_hash": password_hash,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "name": user_data.name,
        "email": email,
        "role": user_data.role
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response, request: Request):
    email = credentials.email.lower()
    
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    
    if attempt and attempt.get("locked_until"):
        if datetime.now(timezone.utc) < attempt["locked_until"]:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        failed_count = attempt.get("count", 0) + 1 if attempt else 1
        
        update_doc = {
            "identifier": identifier,
            "count": failed_count,
            "last_attempt": datetime.now(timezone.utc)
        }
        
        if failed_count >= 5:
            update_doc["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": update_doc},
            upsert=True
        )
        
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }

@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=900,
            path="/"
        )
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============ Cloudinary Routes ============

@api_router.get("/cloudinary/signature")
async def generate_cloudinary_signature(
    user: dict = Depends(get_current_user),
    folder: str = "land_listings"
):
    if not os.getenv("CLOUDINARY_CLOUD_NAME"):
        raise HTTPException(status_code=503, detail="Cloudinary not configured")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": folder
    }

# ============ Listing Routes ============

@api_router.get("/listings")
async def get_listings(
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_size: Optional[float] = None,
    max_size: Optional[float] = None
):
    query = {"status": "approved"}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if min_size is not None or max_size is not None:
        query["land_size"] = {}
        if min_size is not None:
            query["land_size"]["$gte"] = min_size
        if max_size is not None:
            query["land_size"]["$lte"] = max_size
    
    listings = await db.listings.find(query, {"_id": 0}).to_list(1000)
    return listings

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(status_code=400, detail="Invalid listing ID")
    
    listing = await db.listings.find_one({"id": listing_id, "status": "approved"})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.pop("_id", None)
    return listing

@api_router.post("/listings")
async def create_listing(
    listing_data: ListingCreate,
    user: dict = Depends(require_role(["seller"]))
):
    if not listing_data.images:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    listing_id = str(ObjectId())
    listing_doc = {
        "id": listing_id,
        "title": listing_data.title,
        "description": listing_data.description,
        "price": listing_data.price,
        "city": listing_data.city,
        "location": listing_data.location,
        "land_size": listing_data.land_size,
        "images": listing_data.images,
        "status": "pending",
        "seller_id": user["id"],
        "seller_name": user["name"],
        "seller_email": user["email"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.listings.insert_one(listing_doc)
    listing_doc.pop("_id", None)
    return listing_doc

@api_router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: str,
    listing_data: ListingUpdate,
    user: dict = Depends(require_role(["seller"]))
):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this listing")
    
    update_fields = {k: v for k, v in listing_data.model_dump(exclude_unset=True).items() if v is not None}
    
    if update_fields:
        update_fields["status"] = "pending"
        await db.listings.update_one({"id": listing_id}, {"$set": update_fields})
    
    updated_listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return updated_listing

@api_router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if user["role"] != "admin" and listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted successfully"}

@api_router.get("/seller/listings")
async def get_seller_listings(user: dict = Depends(require_role(["seller"]))):
    listings = await db.listings.find({"seller_id": user["id"]}, {"_id": 0}).to_list(1000)
    return listings

# ============ Admin Routes ============

@api_router.get("/admin/listings")
async def get_all_listings(user: dict = Depends(require_role(["admin"]))):
    listings = await db.listings.find({}, {"_id": 0}).to_list(1000)
    return listings

@api_router.put("/admin/listings/{listing_id}/approve")
async def approve_listing(
    listing_id: str,
    user: dict = Depends(require_role(["admin"]))
):
    result = await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"status": "approved"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {"message": "Listing approved"}

@api_router.put("/admin/listings/{listing_id}/reject")
async def reject_listing(
    listing_id: str,
    user: dict = Depends(require_role(["admin"]))
):
    result = await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"status": "rejected"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {"message": "Listing rejected"}

# ============ Message Routes ============

@api_router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    user: dict = Depends(require_role(["buyer"]))
):
    listing = await db.listings.find_one({"id": message_data.listing_id, "status": "approved"})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    message_id = str(ObjectId())
    message_doc = {
        "id": message_id,
        "listing_id": message_data.listing_id,
        "listing_title": listing["title"],
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_email": user["email"],
        "recipient_id": listing["seller_id"],
        "message": message_data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    message_doc.pop("_id", None)
    return message_doc

@api_router.get("/messages")
async def get_messages(user: dict = Depends(get_current_user)):
    query = {"$or": [{"sender_id": user["id"]}, {"recipient_id": user["id"]}]}
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return messages

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
