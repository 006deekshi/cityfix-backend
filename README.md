# CityFix Backend API

Backend API for the CityFix Community Issue Reporting System.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production
```bash
# Start production server
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Reports
- `GET /api/reports` - Get reports (filtered by user role)
- `POST /api/reports` - Create new report (with file upload)
- `PUT /api/reports/:id/status` - Update report status

### Workers (Admin only)
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Create new worker
- `GET /api/workers/nearby` - Get nearby workers

## 🔧 Environment Variables

Copy `.env.example` to `.env` and update:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `ALLOWED_ORIGINS` - CORS allowed origins

## 📁 Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── cityfix.db         # SQLite database (auto-created)
├── uploads/           # File upload directory (auto-created)
└── README.md          # This file
```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - User full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (citizen/worker/admin)
- `location` - Location name
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `created_at` - Creation timestamp

### Reports Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `category` - Issue category
- `photo` - Uploaded photo filename
- `location` - Issue location
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `description` - Issue description
- `status` - Report status (submitted/in-progress/completed)
- `assigned_worker_id` - Assigned worker ID
- `admin_notes` - Admin notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🔐 Default Admin Account

- **Email**: admin@cityfix.com
- **Password**: admin123

⚠️ **Change this in production!**

## 🚀 Deployment

### Railway
1. Push to GitHub
2. Connect repository to Railway
3. Set environment variables
4. Deploy automatically

### Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`

### Render
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`

## 📝 API Usage Examples

### Register User
```javascript
POST /api/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen"
}
```

### Login
```javascript
POST /api/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Report
```javascript
POST /api/reports
Headers: { Authorization: "Bearer <token>" }
FormData: {
  "category": "garbage",
  "location": "Main Street",
  "latitude": "17.6868",
  "longitude": "83.2185",
  "description": "Overflowing garbage bins",
  "photo": <file>
}
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (not implemented yet)

### Adding New Features
1. Add routes in `server.js`
2. Update database schema if needed
3. Test with Postman or similar tool
4. Update this README

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- File upload validation
- CORS protection
- SQL injection prevention with parameterized queries

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment variables are set
3. Ensure database permissions are correct
4. Check CORS settings for frontend integration