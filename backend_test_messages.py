import requests
import sys
import json
from datetime import datetime
import time

class MessagesAPITester:
    def __init__(self, base_url="https://verified-listings-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.seller_session = None
        self.buyer_session = None
        self.listing_id = None

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

    def setup_test_accounts(self):
        """Setup test seller and buyer accounts"""
        print("\n🔍 Setting up test accounts...")
        
        timestamp = int(time.time())
        
        # Setup seller account
        self.seller_session = requests.Session()
        seller_data = {
            "name": "Test Seller Messages",
            "email": f"seller_msg_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "seller"
        }
        
        try:
            response = self.seller_session.post(f"{self.base_url}/api/auth/register", json=seller_data)
            success = response.status_code == 200
            self.log_test("Seller Account Setup", success, f"Status: {response.status_code}")
            
            if not success:
                return False
                
        except Exception as e:
            self.log_test("Seller Account Setup", False, str(e))
            return False
        
        # Setup buyer account
        self.buyer_session = requests.Session()
        buyer_data = {
            "name": "Test Buyer Messages",
            "email": f"buyer_msg_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "buyer"
        }
        
        try:
            response = self.buyer_session.post(f"{self.base_url}/api/auth/register", json=buyer_data)
            success = response.status_code == 200
            self.log_test("Buyer Account Setup", success, f"Status: {response.status_code}")
            
            return success
            
        except Exception as e:
            self.log_test("Buyer Account Setup", False, str(e))
            return False

    def create_test_listing(self):
        """Create a test listing for messaging"""
        print("\n🔍 Creating test listing...")
        
        listing_data = {
            "title": "Test Property for Messages",
            "description": "Beautiful land for testing message functionality",
            "price": 85000,
            "city": "Message City",
            "location": "123 Message Street, Test Area",
            "land_size": 4.2,
            "images": ["https://images.unsplash.com/photo-1762342843162-929a0e96a853"]
        }
        
        try:
            response = self.seller_session.post(f"{self.base_url}/api/listings", json=listing_data)
            success = response.status_code == 200
            
            if success:
                created_listing = response.json()
                self.listing_id = created_listing.get('id')
                success = self.listing_id is not None
                
            self.log_test("Create Test Listing", success, f"Status: {response.status_code}", f"Listing ID: {self.listing_id}")
            return success
            
        except Exception as e:
            self.log_test("Create Test Listing", False, str(e))
            return False

    def approve_test_listing(self):
        """Approve the test listing using admin account"""
        print("\n🔍 Approving test listing...")
        
        admin_session = requests.Session()
        admin_data = {
            "email": "admin@landplatform.com",
            "password": "Admin@123"
        }
        
        try:
            # Login as admin
            response = admin_session.post(f"{self.base_url}/api/auth/login", json=admin_data)
            success = response.status_code == 200
            
            if not success:
                self.log_test("Admin Login for Approval", False, f"Status: {response.status_code}")
                return False
            
            # Approve the listing
            response = admin_session.put(f"{self.base_url}/api/admin/listings/{self.listing_id}/approve")
            success = response.status_code == 200
            
            self.log_test("Approve Test Listing", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Approve Test Listing", False, str(e))
            return False

    def test_send_message(self):
        """Test sending a message from buyer to seller"""
        print("\n🔍 Testing send message...")
        
        message_data = {
            "listing_id": self.listing_id,
            "message": "Hi, I'm interested in this property. Can you provide more details about the location and any development restrictions?"
        }
        
        try:
            response = self.buyer_session.post(f"{self.base_url}/api/messages", json=message_data)
            success = response.status_code == 200
            
            message_response = None
            if success:
                message_response = response.json()
                # Verify message structure
                required_fields = ['id', 'listing_id', 'listing_title', 'sender_id', 'sender_name', 'sender_email', 'message', 'created_at']
                success = all(field in message_response for field in required_fields)
                
            self.log_test("Send Message (Buyer to Seller)", success, f"Status: {response.status_code}", message_response)
            return success
            
        except Exception as e:
            self.log_test("Send Message (Buyer to Seller)", False, str(e))
            return False

    def test_send_multiple_messages(self):
        """Test sending multiple messages to create a conversation"""
        print("\n🔍 Testing multiple messages...")
        
        messages = [
            "What are the soil conditions like?",
            "Is there access to utilities (water, electricity)?",
            "Are there any zoning restrictions I should know about?"
        ]
        
        success_count = 0
        for i, msg_text in enumerate(messages):
            message_data = {
                "listing_id": self.listing_id,
                "message": msg_text
            }
            
            try:
                response = self.buyer_session.post(f"{self.base_url}/api/messages", json=message_data)
                if response.status_code == 200:
                    success_count += 1
                    
            except Exception as e:
                pass
        
        success = success_count == len(messages)
        self.log_test("Send Multiple Messages", success, f"Sent {success_count}/{len(messages)} messages")
        return success

    def test_get_buyer_messages(self):
        """Test getting messages as buyer"""
        print("\n🔍 Testing get buyer messages...")
        
        try:
            response = self.buyer_session.get(f"{self.base_url}/api/messages")
            success = response.status_code == 200
            
            messages = None
            if success:
                messages = response.json()
                success = isinstance(messages, list) and len(messages) > 0
                
                # Verify message structure
                if success and messages:
                    first_message = messages[0]
                    required_fields = ['id', 'listing_id', 'listing_title', 'sender_id', 'sender_name', 'sender_email', 'message', 'created_at']
                    success = all(field in first_message for field in required_fields)
                
            self.log_test("Get Buyer Messages", success, f"Status: {response.status_code}", f"Found {len(messages) if messages else 0} messages")
            return success
            
        except Exception as e:
            self.log_test("Get Buyer Messages", False, str(e))
            return False

    def test_get_seller_messages(self):
        """Test getting messages as seller"""
        print("\n🔍 Testing get seller messages...")
        
        try:
            response = self.seller_session.get(f"{self.base_url}/api/messages")
            success = response.status_code == 200
            
            messages = None
            if success:
                messages = response.json()
                success = isinstance(messages, list) and len(messages) > 0
                
                # Verify seller can see messages sent to them
                if success and messages:
                    # Check that seller is recipient of these messages
                    seller_user = self.seller_session.get(f"{self.base_url}/api/auth/me").json()
                    seller_id = seller_user.get('id')
                    
                    relevant_messages = [msg for msg in messages if msg.get('recipient_id') == seller_id]
                    success = len(relevant_messages) > 0
                
            self.log_test("Get Seller Messages", success, f"Status: {response.status_code}", f"Found {len(messages) if messages else 0} messages")
            return success
            
        except Exception as e:
            self.log_test("Get Seller Messages", False, str(e))
            return False

    def test_message_authorization(self):
        """Test message authorization - only buyers can send messages"""
        print("\n🔍 Testing message authorization...")
        
        message_data = {
            "listing_id": self.listing_id,
            "message": "This should fail - sellers can't send messages"
        }
        
        try:
            # Try to send message as seller (should fail)
            response = self.seller_session.post(f"{self.base_url}/api/messages", json=message_data)
            success = response.status_code == 403  # Should be forbidden
            
            self.log_test("Message Authorization (Seller Cannot Send)", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Message Authorization (Seller Cannot Send)", False, str(e))
            return False

    def test_invalid_listing_message(self):
        """Test sending message to invalid listing"""
        print("\n🔍 Testing invalid listing message...")
        
        message_data = {
            "listing_id": "invalid_listing_id",
            "message": "This should fail - invalid listing"
        }
        
        try:
            response = self.buyer_session.post(f"{self.base_url}/api/messages", json=message_data)
            success = response.status_code == 404  # Should be not found
            
            self.log_test("Invalid Listing Message", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Invalid Listing Message", False, str(e))
            return False

    def test_unauthorized_message_access(self):
        """Test unauthorized access to messages endpoint"""
        print("\n🔍 Testing unauthorized message access...")
        
        try:
            # Test without authentication
            response = requests.get(f"{self.base_url}/api/messages")
            success = response.status_code == 401
            
            self.log_test("Unauthorized Message Access", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Unauthorized Message Access", False, str(e))
            return False

    def test_existing_accounts(self):
        """Test with existing test accounts"""
        print("\n🔍 Testing with existing accounts...")
        
        # Test with existing seller account
        seller_session = requests.Session()
        seller_data = {
            "email": "seller@test.com",
            "password": "Seller@123"
        }
        
        try:
            response = seller_session.post(f"{self.base_url}/api/auth/login", json=seller_data)
            success = response.status_code == 200
            self.log_test("Existing Seller Login", success, f"Status: {response.status_code}")
            
            if success:
                # Test getting messages
                response = seller_session.get(f"{self.base_url}/api/messages")
                success = response.status_code == 200
                messages = response.json() if success else []
                self.log_test("Existing Seller Get Messages", success, f"Status: {response.status_code}", f"Found {len(messages)} messages")
                
        except Exception as e:
            self.log_test("Existing Seller Test", False, str(e))
        
        # Test with existing buyer account
        buyer_session = requests.Session()
        buyer_data = {
            "email": "buyer@test.com",
            "password": "Buyer@123"
        }
        
        try:
            response = buyer_session.post(f"{self.base_url}/api/auth/login", json=buyer_data)
            success = response.status_code == 200
            self.log_test("Existing Buyer Login", success, f"Status: {response.status_code}")
            
            if success:
                # Test getting messages
                response = buyer_session.get(f"{self.base_url}/api/messages")
                success = response.status_code == 200
                messages = response.json() if success else []
                self.log_test("Existing Buyer Get Messages", success, f"Status: {response.status_code}", f"Found {len(messages)} messages")
                
        except Exception as e:
            self.log_test("Existing Buyer Test", False, str(e))

    def run_all_tests(self):
        """Run all message API tests"""
        print("🚀 Starting Messages API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test with existing accounts first
        self.test_existing_accounts()
        self.test_unauthorized_message_access()
        
        # Setup test environment
        if not self.setup_test_accounts():
            print("❌ Failed to setup test accounts, skipping remaining tests")
            return False
        
        if not self.create_test_listing():
            print("❌ Failed to create test listing, skipping remaining tests")
            return False
        
        if not self.approve_test_listing():
            print("❌ Failed to approve test listing, skipping remaining tests")
            return False
        
        # Run message tests
        self.test_send_message()
        self.test_send_multiple_messages()
        self.test_get_buyer_messages()
        self.test_get_seller_messages()
        self.test_message_authorization()
        self.test_invalid_listing_message()
        
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
    tester = MessagesAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())