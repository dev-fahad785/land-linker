import requests
import sys
import json
from datetime import datetime
import time

class LandPlatformAPITester:
    def __init__(self, base_url="https://verified-listings-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        result = {
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def test_basic_endpoints(self):
        """Test basic public endpoints"""
        print("\n🔍 Testing Basic Endpoints...")
        
        # Test public listings endpoint
        try:
            response = requests.get(f"{self.base_url}/api/listings")
            success = response.status_code == 200
            data = response.json() if success else None
            self.log_test("Public Listings Endpoint", success, f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("Public Listings Endpoint", False, str(e))

    def test_admin_authentication(self):
        """Test admin login and access"""
        print("\n🔍 Testing Admin Authentication...")
        
        session = requests.Session()
        
        # Test admin login
        admin_data = {
            "email": "admin@landplatform.com",
            "password": "Admin@123"
        }
        
        try:
            response = session.post(f"{self.base_url}/api/auth/login", json=admin_data)
            success = response.status_code == 200
            login_data = response.json() if success else None
            self.log_test("Admin Login", success, f"Status: {response.status_code}", login_data)
            
            if success:
                # Test admin access to protected endpoint
                response = session.get(f"{self.base_url}/api/auth/me")
                success = response.status_code == 200
                if success:
                    user_data = response.json()
                    success = user_data.get('role') == 'admin'
                self.log_test("Admin Auth Me", success, f"Status: {response.status_code}", user_data if success else None)
                
                # Test admin access to admin endpoints
                response = session.get(f"{self.base_url}/api/admin/listings")
                success = response.status_code == 200
                admin_listings = response.json() if success else None
                self.log_test("Admin Get All Listings", success, f"Status: {response.status_code}", f"Found {len(admin_listings) if admin_listings else 0} listings")
                
        except Exception as e:
            self.log_test("Admin Authentication", False, str(e))

    def test_user_registration_and_auth(self):
        """Test user registration for different roles"""
        print("\n🔍 Testing User Registration...")
        
        timestamp = int(time.time())
        
        # Test buyer registration
        buyer_data = {
            "name": "Test Buyer",
            "email": f"buyer_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/auth/register", json=buyer_data)
            success = response.status_code == 200
            reg_data = response.json() if success else None
            self.log_test("Buyer Registration", success, f"Status: {response.status_code}", reg_data)
        except Exception as e:
            self.log_test("Buyer Registration", False, str(e))
        
        # Test seller registration
        seller_data = {
            "name": "Test Seller",
            "email": f"seller_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/auth/register", json=seller_data)
            success = response.status_code == 200
            reg_data = response.json() if success else None
            self.log_test("Seller Registration", success, f"Status: {response.status_code}", reg_data)
        except Exception as e:
            self.log_test("Seller Registration", False, str(e))

    def test_seller_workflow(self):
        """Test complete seller workflow"""
        print("\n🔍 Testing Seller Workflow...")
        
        session = requests.Session()
        timestamp = int(time.time())
        
        # Register seller
        seller_data = {
            "name": "Test Seller Workflow",
            "email": f"seller_workflow_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        try:
            # Registration
            response = session.post(f"{self.base_url}/api/auth/register", json=seller_data)
            success = response.status_code == 200
            self.log_test("Seller Registration for Workflow", success, f"Status: {response.status_code}")
            
            if not success:
                return
            
            # Test getting seller's listings (should be empty initially)
            response = session.get(f"{self.base_url}/api/seller/listings")
            success = response.status_code == 200
            if success:
                listings = response.json()
                success = isinstance(listings, list)
            self.log_test("Seller Get Own Listings", success, f"Status: {response.status_code}", f"Found {len(listings) if success else 0} listings")
            
            # Test Cloudinary signature generation
            response = session.get(f"{self.base_url}/api/cloudinary/signature")
            success = response.status_code == 200
            if success:
                sig_data = response.json()
                success = all(key in sig_data for key in ['signature', 'timestamp', 'cloud_name', 'api_key'])
            self.log_test("Cloudinary Signature Generation", success, f"Status: {response.status_code}")
            
            # Create a listing
            listing_data = {
                "title": "Test Land Property",
                "description": "Beautiful land for sale with great potential for development",
                "price": 75000,
                "city": "Test City",
                "location": "123 Test Street, Test Area",
                "land_size": 3.5,
                "images": ["https://images.unsplash.com/photo-1762342843162-929a0e96a853"]
            }
            
            response = session.post(f"{self.base_url}/api/listings", json=listing_data)
            success = response.status_code == 200
            listing_id = None
            if success:
                created_listing = response.json()
                listing_id = created_listing.get('id')
                success = created_listing.get('status') == 'pending'
            self.log_test("Seller Create Listing", success, f"Status: {response.status_code}", f"Listing ID: {listing_id}")
            
            # Test getting listings again (should have 1 now)
            if listing_id:
                response = session.get(f"{self.base_url}/api/seller/listings")
                success = response.status_code == 200
                if success:
                    listings = response.json()
                    success = len(listings) >= 1
                self.log_test("Seller Get Listings After Creation", success, f"Status: {response.status_code}", f"Found {len(listings) if success else 0} listings")
            
        except Exception as e:
            self.log_test("Seller Workflow", False, str(e))

    def test_buyer_workflow(self):
        """Test buyer workflow"""
        print("\n🔍 Testing Buyer Workflow...")
        
        session = requests.Session()
        timestamp = int(time.time())
        
        # Register buyer
        buyer_data = {
            "name": "Test Buyer Workflow",
            "email": f"buyer_workflow_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        
        try:
            # Registration
            response = session.post(f"{self.base_url}/api/auth/register", json=buyer_data)
            success = response.status_code == 200
            self.log_test("Buyer Registration for Workflow", success, f"Status: {response.status_code}")
            
            if not success:
                return
            
            # Test getting messages (should be empty initially)
            response = session.get(f"{self.base_url}/api/messages")
            success = response.status_code == 200
            if success:
                messages = response.json()
                success = isinstance(messages, list)
            self.log_test("Buyer Get Messages", success, f"Status: {response.status_code}", f"Found {len(messages) if success else 0} messages")
            
        except Exception as e:
            self.log_test("Buyer Workflow", False, str(e))

    def test_search_and_filter(self):
        """Test search and filter functionality"""
        print("\n🔍 Testing Search and Filter...")
        
        try:
            # Test basic search
            response = requests.get(f"{self.base_url}/api/listings")
            success = response.status_code == 200
            self.log_test("Basic Listings Search", success, f"Status: {response.status_code}")
            
            # Test city filter
            response = requests.get(f"{self.base_url}/api/listings?city=Test")
            success = response.status_code == 200
            self.log_test("Search by City Filter", success, f"Status: {response.status_code}")
            
            # Test price range filter
            response = requests.get(f"{self.base_url}/api/listings?min_price=10000&max_price=100000")
            success = response.status_code == 200
            self.log_test("Price Range Filter", success, f"Status: {response.status_code}")
            
            # Test size filter
            response = requests.get(f"{self.base_url}/api/listings?min_size=1&max_size=10")
            success = response.status_code == 200
            self.log_test("Land Size Filter", success, f"Status: {response.status_code}")
            
            # Test combined filters
            response = requests.get(f"{self.base_url}/api/listings?city=Test&min_price=50000&max_price=100000&min_size=2&max_size=5")
            success = response.status_code == 200
            self.log_test("Combined Filters", success, f"Status: {response.status_code}")
            
        except Exception as e:
            self.log_test("Search and Filter", False, str(e))

    def test_unauthorized_access(self):
        """Test unauthorized access protection"""
        print("\n🔍 Testing Unauthorized Access Protection...")
        
        try:
            # Test accessing protected endpoints without authentication
            response = requests.get(f"{self.base_url}/api/auth/me")
            success = response.status_code == 401
            self.log_test("Unauthorized Auth Me", success, f"Status: {response.status_code}")
            
            response = requests.get(f"{self.base_url}/api/seller/listings")
            success = response.status_code == 401
            self.log_test("Unauthorized Seller Listings", success, f"Status: {response.status_code}")
            
            response = requests.get(f"{self.base_url}/api/admin/listings")
            success = response.status_code == 401
            self.log_test("Unauthorized Admin Listings", success, f"Status: {response.status_code}")
            
            response = requests.post(f"{self.base_url}/api/listings", json={})
            success = response.status_code == 401
            self.log_test("Unauthorized Create Listing", success, f"Status: {response.status_code}")
            
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Land Platform API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Run test suites
        self.test_basic_endpoints()
        self.test_admin_authentication()
        self.test_user_registration_and_auth()
        self.test_seller_workflow()
        self.test_buyer_workflow()
        self.test_search_and_filter()
        self.test_unauthorized_access()
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed >= (self.tests_run * 0.8)  # 80% pass rate

def main():
    tester = LandPlatformAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())