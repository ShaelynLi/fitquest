#!/usr/bin/env python3
"""
Test script for FatSecret API integration
Run this to test the API connectivity and diagnose issues
"""

import asyncio
import httpx
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_fatsecret_api():
    """Test FatSecret API authentication and search"""
    
    # Get credentials from environment
    client_id = os.getenv("FATSECRET_CLIENT_ID")
    client_secret = os.getenv("FATSECRET_CLIENT_SECRET")
    token_url = os.getenv("FATSECRET_TOKEN_URL", "https://oauth.fatsecret.com/connect/token")
    base_url = os.getenv("FATSECRET_BASE_URL", "https://platform.fatsecret.com/rest/server.api")
    
    print("🔍 Testing FatSecret API Integration")
    print("=" * 50)
    
    # Check credentials
    if not client_id or not client_secret:
        print("❌ Missing FatSecret API credentials")
        print("Please set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET in your .env file")
        return False
    
    print(f"✅ Client ID: {client_id[:8]}...")
    print(f"✅ Client Secret: {'*' * len(client_secret)}")
    print(f"✅ Token URL: {token_url}")
    print(f"✅ Base URL: {base_url}")
    
    try:
        # Step 1: Test Authentication
        print("\n🔐 Testing Authentication...")
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        
        auth_headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        auth_data = "grant_type=client_credentials"
        
        async with httpx.AsyncClient() as client:
            auth_response = await client.post(token_url, headers=auth_headers, data=auth_data)
            
            print(f"Auth Status: {auth_response.status_code}")
            
            if auth_response.status_code == 200:
                token_data = auth_response.json()
                access_token = token_data["access_token"]
                print(f"✅ Authentication successful")
                print(f"Token expires in: {token_data.get('expires_in', 'unknown')} seconds")
            else:
                print(f"❌ Authentication failed: {auth_response.status_code}")
                print(f"Response: {auth_response.text}")
                return False
        
        # Step 2: Test API Request
        print("\n🍎 Testing Food Search...")
        
        search_params = {
            "method": "foods.search",
            "search_expression": "apple",
            "page_number": 0,
            "max_results": 5,
            "format": "json",
        }
        
        api_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        async with httpx.AsyncClient() as client:
            api_response = await client.get(base_url, headers=api_headers, params=search_params)
            
            print(f"API Status: {api_response.status_code}")
            print(f"Response (first 200 chars): {api_response.text[:200]}")
            
            if api_response.status_code == 200:
                try:
                    json_response = api_response.json()
                    
                    if "error" in json_response:
                        error_code = json_response["error"].get("code")
                        error_message = json_response["error"].get("message")
                        print(f"❌ FatSecret API Error {error_code}: {error_message}")
                        
                        if error_code == 21:
                            print("\n🔧 SOLUTION:")
                            print("Your IP address is not whitelisted in the FatSecret developer console.")
                            print("1. Go to https://platform.fatsecret.com/api/Console")
                            print("2. Log in to your FatSecret developer account")
                            print("3. Go to 'Manage Applications' > Your App > 'IP Restrictions'")
                            print("4. Add your current IP address to the whitelist")
                            print(f"5. Your current IP appears to be: {get_current_ip()}")
                        return False
                    else:
                        foods = json_response.get("foods_search", {}).get("results", {}).get("food", [])
                        print(f"✅ Search successful! Found {len(foods)} foods")
                        
                        if foods:
                            first_food = foods[0] if isinstance(foods, list) else foods
                            print(f"Sample food: {first_food.get('food_name', 'Unknown')}")
                        
                        return True
                except Exception as e:
                    print(f"❌ Failed to parse JSON response: {e}")
                    return False
            else:
                print(f"❌ API request failed: {api_response.status_code}")
                print(f"Response: {api_response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def get_current_ip():
    """Get current public IP address"""
    try:
        import requests
        response = requests.get("https://api.ipify.org", timeout=5)
        return response.text.strip()
    except:
        return "Unable to determine IP"

async def main():
    success = await test_fatsecret_api()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 FatSecret API test completed successfully!")
        print("Your API integration is working correctly.")
    else:
        print("❌ FatSecret API test failed.")
        print("Please check the error messages above and fix the issues.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
