#!/usr/bin/env python3
"""
Elyn Builder App iOS - Backend API Testing
Tests all authentication, app management, AI chat, and admin endpoints
"""

import requests
import sys
import json
import time
from datetime import datetime

class ElynBuilderAPITester:
    def __init__(self, base_url="https://deploy-automation-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_app_id = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "FAIL")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@elynbuilder.com", "password": "ElynAdmin2024!"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"Admin token obtained: {self.admin_token[:20]}...", "INFO")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"testuser_{int(time.time())}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "username": "Test User",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response.get('id')
            self.log(f"User registered: {test_email}", "INFO")
            return True
        return False

    def test_user_login(self):
        """Test user login with registered user"""
        test_email = f"testuser_{int(time.time())}@example.com"
        # First register
        reg_success, reg_response = self.run_test(
            "User Registration for Login Test",
            "POST",
            "auth/register",
            200,
            data={
                "username": "Login Test User",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if not reg_success:
            return False
            
        # Then login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": test_email, "password": "TestPass123!"}
        )
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        if not self.user_token:
            self.log("No user token available for auth/me test", "SKIP")
            return False
        
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_token=self.user_token
        )[0]

    def test_create_app(self):
        """Test creating a new app"""
        if not self.user_token:
            self.log("No user token available for app creation", "SKIP")
            return False
        
        success, response = self.run_test(
            "Create App",
            "POST",
            "apps",
            200,
            data={
                "name": "Test App",
                "url": "https://example.com",
                "description": "Test app description"
            },
            auth_token=self.user_token
        )
        
        if success and 'id' in response:
            self.test_app_id = response['id']
            self.log(f"App created with ID: {self.test_app_id}", "INFO")
            return True
        return False

    def test_get_apps(self):
        """Test getting user's apps"""
        if not self.user_token:
            self.log("No user token available for get apps", "SKIP")
            return False
        
        return self.run_test(
            "Get User Apps",
            "GET",
            "apps",
            200,
            auth_token=self.user_token
        )[0]

    def test_get_app_by_id(self):
        """Test getting specific app by ID"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        return self.run_test(
            "Get App by ID",
            "GET",
            f"apps/{self.test_app_id}",
            200,
            auth_token=self.user_token
        )[0]

    def test_update_app(self):
        """Test updating app configuration"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        return self.run_test(
            "Update App",
            "PUT",
            f"apps/{self.test_app_id}",
            200,
            data={
                "name": "Updated Test App",
                "primary_color": "#FF5722",
                "enable_geolocation": True
            },
            auth_token=self.user_token
        )[0]

    def test_generate_app(self):
        """Test app generation"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        return self.run_test(
            "Generate App",
            "POST",
            f"apps/{self.test_app_id}/generate",
            200,
            data={},
            auth_token=self.user_token
        )[0]

    def test_ai_chat(self):
        """Test AI chat functionality"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data={
                "app_id": self.test_app_id,
                "message": "Help me optimize my app configuration"
            },
            auth_token=self.user_token
        )
        
        if success and 'response' in response:
            self.log(f"AI Response received: {response['response'][:50]}...", "INFO")
            return True
        return False

    def test_get_chat_history(self):
        """Test getting chat history"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        return self.run_test(
            "Get Chat History",
            "GET",
            f"ai/chat/{self.test_app_id}",
            200,
            auth_token=self.user_token
        )[0]

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            self.log("No admin token available", "SKIP")
            return False
        
        return self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            auth_token=self.admin_token
        )[0]

    def test_admin_get_users(self):
        """Test admin get all users"""
        if not self.admin_token:
            self.log("No admin token available", "SKIP")
            return False
        
        return self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            auth_token=self.admin_token
        )[0]

    def test_admin_get_apps(self):
        """Test admin get all apps"""
        if not self.admin_token:
            self.log("No admin token available", "SKIP")
            return False
        
        return self.run_test(
            "Admin Get All Apps",
            "GET",
            "admin/apps",
            200,
            auth_token=self.admin_token
        )[0]

    def test_admin_block_user(self):
        """Test admin block user functionality"""
        if not self.admin_token or not self.test_user_id:
            self.log("No admin token or test user ID available", "SKIP")
            return False
        
        # Block user
        success = self.run_test(
            "Admin Block User",
            "PUT",
            f"admin/users/{self.test_user_id}/block",
            200,
            data={},
            auth_token=self.admin_token
        )[0]
        
        if success:
            # Unblock user
            unblock_success = self.run_test(
                "Admin Unblock User",
                "PUT",
                f"admin/users/{self.test_user_id}/unblock",
                200,
                data={},
                auth_token=self.admin_token
            )[0]
            return unblock_success
        
        return False

    def test_logout(self):
        """Test logout functionality"""
        if not self.user_token:
            self.log("No user token available for logout", "SKIP")
            return False
        
        return self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200,
            data={},
            auth_token=self.user_token
        )[0]

    def test_delete_app(self):
        """Test deleting an app"""
        if not self.user_token or not self.test_app_id:
            self.log("No user token or app ID available", "SKIP")
            return False
        
        return self.run_test(
            "Delete App",
            "DELETE",
            f"apps/{self.test_app_id}",
            200,
            auth_token=self.user_token
        )[0]

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("Starting Elyn Builder App iOS Backend API Tests", "START")
        self.log(f"Testing against: {self.base_url}", "INFO")
        
        # Health check
        self.test_health_check()
        
        # Authentication tests
        self.test_admin_login()
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        
        # App management tests
        self.test_create_app()
        self.test_get_apps()
        self.test_get_app_by_id()
        self.test_update_app()
        self.test_generate_app()
        
        # AI chat tests
        self.test_ai_chat()
        self.test_get_chat_history()
        
        # Admin tests
        self.test_admin_stats()
        self.test_admin_get_users()
        self.test_admin_get_apps()
        self.test_admin_block_user()
        
        # Cleanup tests
        self.test_logout()
        self.test_delete_app()
        
        # Print results
        self.print_results()
        
        return self.tests_passed == self.tests_run

    def print_results(self):
        """Print test results summary"""
        self.log("=" * 60, "RESULT")
        self.log(f"Tests completed: {self.tests_run}", "RESULT")
        self.log(f"Tests passed: {self.tests_passed}", "RESULT")
        self.log(f"Tests failed: {len(self.failed_tests)}", "RESULT")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%", "RESULT")
        
        if self.failed_tests:
            self.log("Failed tests:", "RESULT")
            for failure in self.failed_tests:
                self.log(f"  - {failure}", "RESULT")
        
        self.log("=" * 60, "RESULT")

def main():
    """Main test execution"""
    tester = ElynBuilderAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())