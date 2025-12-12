# EnergySaver Pro - Smart Home Energy Manager

A comprehensive MERN stack application for monitoring and optimizing home energy consumption with real-time tracking, intelligent automation, and AI-powered insights.

![EnergySaver Pro](https://img.shields.io/badge/MERN-Stack-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-orange)

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with user and admin roles
- **Home Registration**: Register and manage smart homes with detailed profiles
- **Device Management**: Add, edit, delete, and monitor smart devices in real-time
- **Real-time Energy Tracking**: Live power consumption monitoring with Socket.IO
- **Usage Limits & Alerts**: Set daily limits and receive automated alerts
- **Neighborhood Comparison**: Compare usage with similar homes in your area
- **Comprehensive Reports**: Daily, weekly, and monthly analytics with forecasting
- **Admin Dashboard**: Manage device templates and view community insights

### Advanced Features
- **Automation Engine**: Smart automation rules with multiple modes (Eco, Sleep, Away)
- **Peak Hour Analysis**: Identify and optimize peak consumption periods
- **Cost Breakdown**: Detailed cost analysis by device, category, and time of day
- **Goal Tracking**: Set and monitor energy consumption goals
- **Carbon Impact**: Track environmental impact and carbon footprint
- **Export Functionality**: Export reports as PDF or Excel
- **Email Notifications**: Automated email alerts for important events
- **Device Scheduling**: Schedule devices to turn on/off automatically

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Socket.IO Client** - Real-time updates
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Node-cron** - Scheduled tasks

### Additional Services
- **PDFKit** - PDF generation
- **XLSX** - Excel export
- **Nodemailer** - Email service
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or pnpm package manager

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd fullstack2
```

### 2. Install dependencies
```bash
# Install all dependencies
npm install
# or
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/energysaver
# or use MongoDB Atlas
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/energysaver

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3001

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### 4. Start the Application

#### Development Mode (Both servers concurrently)
```bash
npm run dev
```

#### Or start separately:

**Backend Server:**
```bash
npm run server
# Server runs on http://localhost:3001
```

**Frontend Client:**
```bash
npm run client
# Client runs on http://localhost:5173
```

## 📱 Usage

### First Time Setup

1. **Register an Account**
   - Navigate to `http://localhost:5173/register`
   - Fill in your details and home information
   - Set your electricity tariff rate

2. **Add Devices**
   - Go to the Devices page
   - Click "Add Device"
   - Enter device details (name, category, rated power)
   - Assign to a room

3. **Configure Automation**
   - Set daily usage limits for devices
   - Create schedules for automatic on/off
   - Enable automation modes (Eco, Sleep, Away)

4. **Monitor Usage**
   - View real-time consumption on Dashboard
   - Check alerts for limit breaches
   - Compare with neighborhood averages

5. **Generate Reports**
   - Navigate to Reports page
   - Select period (daily/weekly/monthly)
   - View detailed analytics and recommendations
   - Export as PDF or Excel

### Admin Features

To access admin features, you need an admin account:

1. **Create Admin User** (via MongoDB):
```javascript
// Connect to MongoDB and update user role
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

2. **Admin Dashboard**
   - Access at `http://localhost:5173/admin`
   - Manage device templates
   - View community statistics
   - Analyze usage patterns across all homes

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `PUT /api/devices/:id/toggle` - Toggle device status

### Usage & Alerts
- `GET /api/usage?period=daily` - Get usage data
- `GET /api/alerts` - Get alerts
- `PUT /api/alerts/:id` - Mark alert as read

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/:id` - Get specific report

### Automation
- `GET /api/automation/rules` - Get automation rules
- `POST /api/automation/rules` - Create rule
- `POST /api/automation/modes/:modeId/activate` - Activate mode

### Admin (Requires admin role)
- `GET /api/admin/overview` - Community overview
- `GET /api/admin/analytics` - Community analytics
- `GET /api/admin/templates` - Get device templates
- `POST /api/admin/templates` - Create template

### Comparison
- `GET /api/comparison/insights` - Get neighborhood comparison
- `GET /api/comparison/profile` - Get household profile
- `PUT /api/comparison/profile` - Update household profile

See [Postman Collection](./EnergySaver_API_Collection.json) for detailed API documentation.

## 📊 Database Models

### User
- Authentication credentials
- Profile information
- Preferences and settings
- Role (user/admin)

### Home
- Home details and address
- Tariff plan configuration
- Rooms and zones
- Household profile for comparison

### Device
- Device specifications
- Current status and power
- Automation settings
- Alert rules

### Alert
- Alert type and severity
- Associated device
- Status and timestamp

### Report
- Report period and type
- Device statistics
- Peak hours analysis
- Cost breakdown
- Forecasting data

### AutomationRule
- Rule conditions
- Actions and triggers
- Active status

## 🧪 Testing

### Manual Testing
1. Start both servers
2. Register a new user
3. Add sample devices
4. Toggle devices and observe real-time updates
5. Check alerts generation
6. Generate reports

### API Testing
Use the provided Postman collection:
```bash
# Import EnergySaver_API_Collection.json into Postman
# Set environment variables (token, baseUrl)
# Run the collection
```

## 📦 Sample Data

The application includes comprehensive sample data for quick testing and demonstration:

### Automatic Simulation
The simulation service (`server/services/simulation.js`) generates realistic energy consumption data automatically when devices are turned on. The simulation includes:
- Time-of-day usage patterns
- Seasonal variations
- Device-specific behavior patterns

### Sample Device Dataset
A ready-to-use dataset of 20 realistic devices is provided:

**Quick Setup:**
```bash
# Seed your account with sample devices
node server/seed-devices.js your-email@example.com
```

**What's Included:**
- 20 pre-configured devices across 12 categories
- Realistic power ratings (15W to 2000W)
- Pre-configured automation rules and schedules
- Room and floor assignments
- Total rated power: ~9.5kW

**Files:**
- `sample-devices.json` - Device data in JSON format
- `server/seed-devices.js` - Database seeding script
- `SAMPLE_DEVICES.md` - Complete documentation

See [SAMPLE_DEVICES.md](./SAMPLE_DEVICES.md) for detailed information.

### Manual Testing
To create test devices manually:
```bash
# Run the test script
bash test_devices.sh
```


## 🚢 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables
2. Ensure MongoDB connection string is set
3. Deploy using platform-specific commands

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend:
```bash
npm run build
```
2. Deploy the `dist` folder
3. Set environment variables for API URL

### Full Stack Deployment
Consider using:
- **Railway** - Easy full-stack deployment
- **Render** - Free tier available
- **DigitalOcean** - App Platform
- **AWS** - EC2 + RDS

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS configuration
- Input validation
- MongoDB injection prevention

## 🎨 UI/UX Features

- Responsive design for mobile and desktop
- Real-time data updates
- Interactive charts and graphs
- Dark/Light theme support
- Smooth animations with Framer Motion
- Toast notifications for user feedback
- Loading states and error handling

## 📝 Project Structure

```
fullstack2/
├── server/                 # Backend
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── services/          # Business logic
│   ├── middleware/        # Auth middleware
│   ├── utils/             # Utilities
│   └── index.js           # Server entry point
├── src/                   # Frontend
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # Redux store
│   ├── context/           # React context
│   └── App.jsx            # App entry point
├── public/                # Static assets
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README.md              # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Aayush Kamble** - Initial development

## 🙏 Acknowledgments

- MERN Stack community
- Recharts for visualization
- Socket.IO for real-time features
- All open-source contributors

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: [your-email@example.com]

## 🗺️ Roadmap

### Completed ✅
- User authentication and authorization
- Device management with CRUD operations
- Real-time energy monitoring
- Automated alerts and notifications
- Comprehensive reporting system
- Neighborhood comparison
- Admin dashboard
- Automation engine
- Export functionality

### Future Enhancements 🚀
- Mobile app (React Native)
- Voice control integration (Alexa/Google Home)
- Solar panel integration
- Energy credit trading marketplace
- Machine learning for consumption prediction
- Integration with smart home platforms (HomeKit, SmartThings)
- Multi-language support
- Advanced analytics with AI insights

---

**Built with ❤️ using the MERN Stack**
