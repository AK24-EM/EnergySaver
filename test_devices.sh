#!/bin/bash

# Configuration
API_URL="http://localhost:3001/api"
EMAIL="test_device_$(date +%s)@example.com"
PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "------------------------------------------------"
echo "Starting Device API Tests"
echo "------------------------------------------------"

# 1. Register User to get Token
echo -e "\n1. Registering new test user..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Device Tester",
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'",
    "homeData": {
        "name": "Test Home",
        "address": "123 Test St"
    }
  }')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to register/login. Response: $RESPONSE${NC}"
    exit 1
fi

echo -e "${GREEN}Success! Token received.${NC}"

# 2. Get Templates (GET /devices/templates)
echo -e "\n2. Fetching Device Templates (GET /devices/templates)..."
curl -s -X GET "$API_URL/devices/templates" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"templates":\[.*\]' | cut -c 1-100...
echo -e "${GREEN}Done.${NC}"

# 3. Add Device (POST /devices)
echo -e "\n3. Adding New Device (POST /devices)..."
DEVICE_RES=$(curl -s -X POST "$API_URL/devices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Living Room AC",
    "type": "AC",
    "category": "Cooling",
    "ratedPower": 1500,
    "location": { "room": "Living Room" }
  }')

DEVICE_ID=$(echo $DEVICE_RES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$DEVICE_ID" ]; then
     echo -e "${RED}Failed to create device. Response: $DEVICE_RES${NC}"
     exit 1
fi
echo -e "${GREEN}Device Created! ID: $DEVICE_ID${NC}"

# 4. List Devices (GET /devices)
echo -e "\n4. Listing Devices (GET /devices)..."
curl -s -X GET "$API_URL/devices" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"devices":\[.*\]' | cut -c 1-100...
echo -e "${GREEN}Done.${NC}"

# 5. Get Device Stats (GET /devices/:id/stats)
echo -e "\n5. Getting Device Stats (GET /devices/$DEVICE_ID/stats)..."
curl -s -X GET "$API_URL/devices/$DEVICE_ID/stats" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"stats":{.*}' | cut -c 1-100...
echo -e "${GREEN}Done.${NC}"

# 6. Update Device (PUT /devices/:id)
echo -e "\n6. Updating Device (PUT /devices/$DEVICE_ID)..."
curl -s -X PUT "$API_URL/devices/$DEVICE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Living Room AC",
    "isActive": true
  }' | grep -o '"name":"Updated Living Room AC"'
echo -e "\n${GREEN}Done.${NC}"

# 7. Toggle Automation (POST /devices/:id/automation)
echo -e "\n7. Setting Automation (POST /devices/$DEVICE_ID/automation)..."
curl -s -X POST "$API_URL/devices/$DEVICE_ID/automation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "dailyLimit",
    "enabled": true,
    "settings": { "threshold": 5000, "action": "notify" }
  }' | grep -o '"message":".*"'
echo -e "\n${GREEN}Done.${NC}"

# 8. Bulk Optimization (POST /devices/optimization)
echo -e "\n8. Running Bulk Optimization (POST /devices/optimization)..."
curl -s -X POST "$API_URL/devices/optimization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "turnOffIdle"
  }' | grep -o '"message":".*"'
echo -e "\n${GREEN}Done.${NC}"

# 9. Delete Device (DELETE /devices/:id)
echo -e "\n9. Deleting Device (DELETE /devices/$DEVICE_ID)..."
curl -s -X DELETE "$API_URL/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"message":".*"'
echo -e "\n${GREEN}Done.${NC}"

echo "------------------------------------------------"
echo "Tests Completed"
echo "------------------------------------------------"
