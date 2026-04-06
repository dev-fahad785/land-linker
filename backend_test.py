import requests
import sys
import json
from datetime import datetime
import time

class LandPlatformAPITester:
    def __init__(self, base_url="https://verified-listings-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.test_listing_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
    def test_auth_register(self):
        """Test user registration for buyer and seller"""
        print("\n🔍 Testing User Registration...")
        
        # Test buyer registration
        buyer_data = {
            "name": "Test Buyer",
            "email": f"buyer_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register", json=buyer_data)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.buyer_token = self.session.cookies.get('access_token')
            self.log_test("Buyer Registration", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Buyer Registration", False, str(e))
        
        # Test seller registration
        seller_data = {
            "name": "Test Seller",
            "email": f"seller_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register", json=seller_data)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.seller_token = self.session.cookies.get('access_token')
            self.log_test("Seller Registration", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Seller Registration", False, str(e))

    def test_auth_login(self):
        """Test login functionality"""
        print("\n🔍 Testing User Login...")
        
        # Test admin login
        admin_data = {
            "email": "admin@landplatform.com",
            "password": "Admin@123"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login", json=admin_data)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.admin_token = self.session.cookies.get('access_token')
            self.log_test("Admin Login", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Admin Login", False, str(e))

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = "email" in data and "role" in data
            self.log_test("Get Current User", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Current User", False, str(e))

    def test_protected_routes(self):
        """Test protected routes without authentication"""
        print("\n🔍 Testing Protected Routes...")
        
        # Clear cookies to test unauthorized access
        self.session.cookies.clear()
        
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 401
            self.log_test("Unauthorized Access Protection", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, str(e))

    def test_seller_create_listing(self):
        """Test creating a listing as seller"""
        print("\n🔍 Testing Seller Create Listing...")
        
        # Create a new session for seller
        seller_session = requests.Session()
        
        # Register seller
        seller_data = {
            "name": "Test Seller",
            "email": f"seller_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        reg_response = seller_session.post(f"{self.base_url}/api/auth/register", json=seller_data)
        if reg_response.status_code != 200:
            self.log_test("Seller Create Listing", False, f"Registration failed: {reg_response.status_code}")
            return
        
        listing_data = {
            "title": "Test Land Property",
            "description": "Beautiful land for sale with great potential",
            "price": 50000,
            "city": "Test City",
            "location": "Test Location",
            "land_size": 2.5,
            "images": ["https://images.unsplash.com/photo-1762342843162-929a0e96a853"]
        }
        
        try:
            response = seller_session.post(f"{self.base_url}/api/listings", json=listing_data)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.test_listing_id = data.get('id')
                success = data.get('status') == 'pending'
            self.log_test("Seller Create Listing", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Seller Create Listing", False, str(e))

    def test_seller_get_listings(self):
        """Test getting seller's own listings"""
        print("\n🔍 Testing Seller Get Own Listings...")
        
        # Create a new session for seller
        seller_session = requests.Session()
        
        # Register seller
        seller_data = {
            "name": "Test Seller 2",
            "email": f"seller2_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        reg_response = seller_session.post(f"{self.base_url}/api/auth/register", json=seller_data)
        if reg_response.status_code != 200:
            self.log_test("Seller Get Own Listings", False, f"Registration failed: {reg_response.status_code}")
            return
        
        try:
            response = seller_session.get(f"{self.base_url}/api/seller/listings")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
            self.log_test("Seller Get Own Listings", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Seller Get Own Listings", False, str(e))

    def test_admin_get_all_listings(self):
        """Test admin getting all listings"""
        print("\n🔍 Testing Admin Get All Listings...")
        
        # Create a new session for admin
        admin_session = requests.Session()
        
        # Login as admin
        admin_data = {
            "email": "admin@landplatform.com",
            "password": "Admin@123"
        }
        login_response = admin_session.post(f"{self.base_url}/api/auth/login", json=admin_data)
        if login_response.status_code != 200:
            self.log_test("Admin Get All Listings", False, f"Admin login failed: {login_response.status_code}")
            return
        
        try:
            response = admin_session.get(f"{self.base_url}/api/admin/listings")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
            self.log_test("Admin Get All Listings", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Admin Get All Listings", False, str(e))

    def test_admin_approve_listing(self):
        """Test admin approving a listing"""
        print("\n🔍 Testing Admin Approve Listing...")
        
        if not self.test_listing_id:
            self.log_test("Admin Approve Listing", False, "No test listing ID available")
            return
        
        try:
            response = self.session.put(f"{self.base_url}/api/admin/listings/{self.test_listing_id}/approve")
            success = response.status_code == 200
            self.log_test("Admin Approve Listing", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Admin Approve Listing", False, str(e))

    def test_public_listings(self):
        """Test getting public approved listings"""
        print("\n🔍 Testing Public Listings...")
        
        # Clear cookies to test public access
        self.session.cookies.clear()
        
        try:
            response = self.session.get(f"{self.base_url}/api/listings")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
            self.log_test("Public Get Approved Listings", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Public Get Approved Listings", False, str(e))

    def test_search_filter_listings(self):
        """Test search and filter functionality"""
        print("\n🔍 Testing Search and Filter...")
        
        try:
            # Test city filter
            response = self.session.get(f"{self.base_url}/api/listings?city=Test")
            success = response.status_code == 200
            self.log_test("Search by City", success, f"Status: {response.status_code}")
            
            # Test price range filter
            response = self.session.get(f"{self.base_url}/api/listings?min_price=10000&max_price=100000")
            success = response.status_code == 200
            self.log_test("Filter by Price Range", success, f"Status: {response.status_code}")
            
            # Test size filter
            response = self.session.get(f"{self.base_url}/api/listings?min_size=1&max_size=5")
            success = response.status_code == 200
            self.log_test("Filter by Land Size", success, f"Status: {response.status_code}")
            
        except Exception as e:
            self.log_test("Search and Filter", False, str(e))

    def test_buyer_messaging(self):
        """Test buyer sending messages to sellers"""
        print("\n🔍 Testing Buyer Messaging...")
        
        # Login as buyer
        buyer_data = {
            "email": f"buyer_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        self.session.post(f"{self.base_url}/api/auth/register", json=buyer_data)
        
        if not self.test_listing_id:
            self.log_test("Buyer Send Message", False, "No test listing ID available")
            return
        
        message_data = {
            "listing_id": self.test_listing_id,
            "message": "I'm interested in this property. Can we discuss?"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/messages", json=message_data)
            success = response.status_code == 200
            self.log_test("Buyer Send Message", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Buyer Send Message", False, str(e))

    def test_get_messages(self):
        """Test getting user messages"""
        print("\n🔍 Testing Get Messages...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/messages")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = isinstance(data, list)
            self.log_test("Get User Messages", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get User Messages", False, str(e))

    def test_cloudinary_signature(self):
        """Test Cloudinary signature generation"""
        print("\n🔍 Testing Cloudinary Integration...")
        
        # Login as seller
        seller_data = {
            "email": f"seller_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        self.session.post(f"{self.base_url}/api/auth/register", json=seller_data)
        
        try:
            response = self.session.get(f"{self.base_url}/api/cloudinary/signature")
            success = response.status_code == 200
            if success:
                data = response.json()
                success = all(key in data for key in ['signature', 'timestamp', 'cloud_name', 'api_key'])
            self.log_test("Cloudinary Signature Generation", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Cloudinary Signature Generation", False, str(e))

    def test_auth_logout(self):
        """Test logout functionality"""
        print("\n🔍 Testing Logout...")
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            success = response.status_code == 200
            self.log_test("User Logout", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("User Logout", False, str(e))

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔍 Testing Role-Based Access Control...")
        
        # Test buyer trying to access seller endpoints
        buyer_data = {
            "email": f"buyer_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        self.session.post(f"{self.base_url}/api/auth/register", json=buyer_data)
        
        try:
            # Buyer trying to create listing (should fail)
            listing_data = {
                "title": "Unauthorized Listing",
                "description": "This should fail",
                "price": 10000,
                "city": "Test",
                "location": "Test",
                "land_size": 1,
                "images": ["test.jpg"]
            }
            response = self.session.post(f"{self.base_url}/api/listings", json=listing_data)
            success = response.status_code == 403
            self.log_test("Buyer Cannot Create Listing", success, f"Status: {response.status_code}")
            
            # Buyer trying to access admin endpoints (should fail)
            response = self.session.get(f"{self.base_url}/api/admin/listings")
            success = response.status_code == 403
            self.log_test("Buyer Cannot Access Admin Endpoints", success, f"Status: {response.status_code}")
            
        except Exception as e:
            self.log_test("Role-Based Access Control", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Land Platform API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test authentication
        self.test_auth_register()
        self.test_auth_login()
        self.test_auth_me()
        self.test_protected_routes()
        
        # Test listings
        self.test_seller_create_listing()
        self.test_seller_get_listings()
        self.test_admin_get_all_listings()
        self.test_admin_approve_listing()
        self.test_public_listings()
        self.test_search_filter_listings()
        
        # Test messaging
        self.test_buyer_messaging()
        self.test_get_messages()
        
        # Test integrations
        self.test_cloudinary_signature()
        
        # Test security
        self.test_role_based_access()
        self.test_auth_logout()
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LandPlatformAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())