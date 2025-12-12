import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const EMAIL = 'settings_tester_01@example.com';
const PASSWORD = 'password123';

async function testAutomation() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Logged in.');

        // 2. Get Devices
        console.log('Fetching devices...');
        const devicesRes = await axios.get(`${API_URL}/devices`, config);
        let device = devicesRes.data.devices[0];

        if (!device) {
            console.log('No devices found. Creating a test device...');
            const createRes = await axios.post(`${API_URL}/devices`, {
                name: 'Test AC',
                category: 'AC',
                room: 'Living Room',
                ratedPower: 2000
            }, config);
            device = createRes.data.device;
            console.log('Created test device.');
        }
        console.log(`Testing with device: ${device.name} (${device._id})`);

        // 3. Update Daily Limit
        console.log('Setting Daily Limit to 7.7 kWh...');
        const updateLimitRes = await axios.post(`${API_URL}/devices/${device._id}/automation`, {
            type: 'dailyLimit',
            enabled: true,
            settings: { threshold: 7.7, action: 'notify' }
        }, config);

        const updatedDeviceLimit = updateLimitRes.data.device;
        if (updatedDeviceLimit.automation.dailyLimit.enabled === true &&
            updatedDeviceLimit.automation.dailyLimit.threshold === 7.7) {
            console.log('PASS: Daily Limit updated successfully.');
        } else {
            console.error('FAIL: Daily Limit mismatch:', updatedDeviceLimit.automation.dailyLimit);
        }

        // 4. Update Schedule
        console.log('Setting Schedule 09:00 - 17:00...');
        const updateSchedRes = await axios.post(`${API_URL}/devices/${device._id}/automation`, {
            type: 'schedule',
            enabled: true,
            settings: { startTime: '09:00', endTime: '17:00' }
        }, config);

        const updatedDeviceSched = updateSchedRes.data.device;
        if (updatedDeviceSched.automation.schedule.enabled === true &&
            updatedDeviceSched.automation.schedule.startTime === '09:00' &&
            updatedDeviceSched.automation.schedule.endTime === '17:00') {
            console.log('PASS: Schedule updated successfully.');
        } else {
            console.error('FAIL: Schedule mismatch:', updatedDeviceSched.automation.schedule);
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testAutomation();
