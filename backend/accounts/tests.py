from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        # Create a test user for auth checks
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='TestPassword123!',
            first_name='Test',
            last_name='User',
            role=User.Role.FLEET_MANAGER
        )
        self.login_url = reverse('token_obtain_pair')
        self.register_url = reverse('auth_register')
        self.refresh_url = reverse('token_refresh')
        self.logout_url = reverse('auth_logout')
        self.profile_url = reverse('user_profile')

    def test_user_registration_success(self):
        payload = {
            "email": "newdriver@example.com",
            "password": "DriverPassword123!",
            "confirm_password": "DriverPassword123!",
            "full_name": "New Driver",
            "role": "DRIVER"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "newdriver@example.com")
        self.assertEqual(response.data["user"]["role"], "DRIVER")

    def test_user_registration_password_mismatch(self):
        payload = {
            "email": "newdriver@example.com",
            "password": "DriverPassword123!",
            "confirm_password": "MismatchedPassword123!",
            "full_name": "New Driver",
            "role": "DRIVER"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_success(self):
        payload = {
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["role"], "FLEET_MANAGER")
        self.assertEqual(response.data["user"]["full_name"], "Test User")

    def test_login_failure(self):
        payload = {
            "email": "testuser@example.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_protected_endpoint(self):
        # Request profile without token
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate first
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "testuser@example.com")
        self.assertEqual(response.data["role"], "FLEET_MANAGER")

    def test_token_refresh(self):
        # Log in first to get tokens
        payload = {
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        login_res = self.client.post(self.login_url, payload, format='json')
        refresh_token = login_res.data["refresh"]

        # Call refresh API
        refresh_payload = {
            "refresh": refresh_token
        }
        response = self.client.post(self.refresh_url, refresh_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_blacklists_token(self):
        # Log in first to get tokens
        payload = {
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        login_res = self.client.post(self.login_url, payload, format='json')
        refresh_token = login_res.data["refresh"]

        # Authenticate request
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data["access"])
        
        # Logout
        logout_payload = {
            "refresh": refresh_token
        }
        response = self.client.post(self.logout_url, logout_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        # Verify that using the refresh token again fails (blacklisted)
        refresh_response = self.client.post(self.refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
