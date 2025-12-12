# Sample Device Dataset

This directory contains a comprehensive sample device dataset for the EnergySaver application.

## Files

### 1. `sample-devices.json`
A JSON file containing 20 realistic smart home devices with:
- **Various Categories**: AC, Refrigerator, Washing Machine, TV, Light, Fan, Heater, Microwave, Computer, Kitchen appliances, Entertainment devices
- **Power Ratings**: Ranging from 15W (WiFi Router) to 2000W (Water Heater)
- **Locations**: Distributed across different rooms and floors
- **Automation Settings**: Pre-configured daily limits and schedules for demonstration

### 2. `server/seed-devices.js`
A Node.js script to automatically populate your database with sample devices.

## Usage

### Method 1: Using the Seed Script (Recommended)

1. **Register a user account** (if you haven't already):
   ```bash
   # Via the web app at http://localhost:5173/register
   # Or use the API
   ```

2. **Run the seed script** with your user email:
   ```bash
   node server/seed-devices.js your-email@example.com
   ```

3. **Example output**:
   ```
   📡 Connecting to MongoDB...
   ✅ Connected to MongoDB
   🔍 Looking for user: user@example.com
   ✅ Found user: John Doe
   🏠 Home: My Smart Home
   📄 Loading sample devices...
   📦 Found 20 sample devices
   🔨 Creating sample devices...
     ✓ Created: Living Room AC (AC, 1500W)
     ✓ Created: Bedroom AC (AC, 1200W)
     ...
   ✅ Successfully created 20 devices!
   
   📊 Device Summary:
     AC: 2 device(s)
     Refrigerator: 1 device(s)
     Washing Machine: 1 device(s)
     TV: 2 device(s)
     Light: 3 device(s)
     Fan: 2 device(s)
     Heater: 1 device(s)
     Microwave: 1 device(s)
     Computer: 1 device(s)
     Kitchen: 3 device(s)
     Entertainment: 2 device(s)
     Other: 2 device(s)
   
   ⚡ Total Rated Power: 9565W (9.57kW)
   ```

### Method 2: Manual Import via API

Use the Postman collection to manually add devices:

1. Import `EnergySaver_API_Collection.json` into Postman
2. Login to get your auth token
3. Use the "Create Device" endpoint with data from `sample-devices.json`

### Method 3: Using the Web Interface

1. Login to the application at `http://localhost:5173`
2. Navigate to the Devices page
3. Click "Add Device" and manually enter device details
4. Use the sample data as reference

## Device Categories Included

| Category | Count | Example Devices | Power Range |
|----------|-------|-----------------|-------------|
| AC | 2 | Living Room AC, Bedroom AC | 1200-1500W |
| Refrigerator | 1 | Kitchen Refrigerator | 150W |
| Washing Machine | 1 | Washing Machine | 500W |
| TV | 2 | Living Room TV, Bedroom TV | 80-120W |
| Light | 3 | Various room lights | 40-60W |
| Fan | 2 | Ceiling fans | 75W |
| Heater | 1 | Water Heater | 2000W |
| Microwave | 1 | Microwave Oven | 1000W |
| Computer | 1 | Desktop Computer | 300W |
| Kitchen | 3 | Kettle, Dishwasher | 1500-1800W |
| Entertainment | 2 | Gaming Console, Sound System | 150-200W |
| Other | 2 | WiFi Router, Iron Box | 15-1000W |

## Automation Features Demonstrated

The sample devices include various automation configurations:

### Daily Limits
- **Living Room AC**: 8 kWh/day limit with notification
- **Bedroom AC**: 10 kWh/day limit with auto turn-off
- **Water Heater**: 2 kWh/day limit with auto turn-off
- **Gaming Console**: 4 kWh/day limit with notification

### Schedules
- **Living Room AC**: Auto ON 14:00-22:00
- **Bedroom AC**: Auto ON 22:00-06:00 (night cooling)
- **Water Heater**: Auto ON 06:00-08:00 (morning shower)
- **Dishwasher**: Auto ON 22:00-23:30 (off-peak hours)
- **Lights**: Auto ON during evening hours

## Realistic Usage Patterns

The simulation service (`server/services/simulation.js`) generates realistic usage data based on:

- **Time of Day**: Peak usage during evening hours (18:00-23:00)
- **Device Type**: Different patterns for AC, TV, lights, etc.
- **Seasonal Variation**: AC usage higher in summer months
- **Random Fluctuations**: Natural variation in power consumption

## Testing Scenarios

Use this dataset to test:

1. **Device Management**: Add, edit, delete, toggle devices
2. **Real-time Monitoring**: Watch power consumption update live
3. **Alert Generation**: Trigger alerts by exceeding daily limits
4. **Automation**: Test scheduled on/off and limit enforcement
5. **Reports**: Generate comprehensive usage reports
6. **Cost Analysis**: Calculate electricity costs
7. **Neighborhood Comparison**: Compare with benchmark data
8. **Peak Hour Analysis**: Identify high-consumption periods

## Customization

You can customize the sample devices by editing `sample-devices.json`:

```json
{
  "name": "Your Device Name",
  "category": "AC|Refrigerator|TV|Light|Fan|Heater|Microwave|Computer|Kitchen|Entertainment|Other",
  "ratedPower": 1500,
  "location": {
    "room": "Room Name",
    "floor": "Ground|First|Second"
  },
  "automation": {
    "dailyLimit": {
      "enabled": true,
      "threshold": 8,
      "action": "notify|turn_off"
    },
    "schedule": {
      "enabled": true,
      "startTime": "14:00",
      "endTime": "22:00",
      "action": "turn_on|turn_off"
    }
  }
}
```

## Troubleshooting

### Script fails with "User not found"
- Make sure you've registered a user account first
- Check that you're using the correct email address
- Verify MongoDB connection

### No usage data appearing
- Toggle devices ON in the web interface
- Wait 30 seconds for the simulation cycle to run
- Check server logs for simulation activity

### Devices not showing in the app
- Refresh the browser page
- Check that you're logged in with the correct account
- Verify devices were created in the database

## Additional Resources

- **API Documentation**: See `EnergySaver_API_Collection.json`
- **README**: See main `README.md` for full setup instructions
- **Walkthrough**: See verification walkthrough for feature details

---

**Note**: The sample devices are designed to demonstrate all features of the EnergySaver application. Feel free to modify, add, or remove devices based on your testing needs.
