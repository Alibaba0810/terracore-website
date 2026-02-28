# TerraCore Solutions Backend

Backend API for TerraCore Solutions - A real estate company website.

## Features

- **User Authentication** - Register, login, JWT-based authentication
- **Properties Management** - CRUD operations for property listings
- **Building Materials** - Manage building materials inventory
- **Contact Form** - Handle contact form submissions with email notifications
- **Newsletter** - Subscribe/unsubscribe functionality

## Tech Stack

- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT for authentication
- bcryptjs for password hashing
- Nodemailer for email notifications

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Navigate to the backend directory:
   
```
bash
   cd backend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Create a `.env` file (optional - a sample `.env` file is already provided):
   
```
bash
   # Copy the example .env file and modify as needed
   
```

4. Start the server:
   
```
bash
   npm start
   
```

The server will run on `http://localhost:3000`

## Default Admin Account

The backend automatically creates a default admin user:

- **Email:** admin@terracore.com
- **Password:** admin123

**Important:** Change this password in production!

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/users` | Get all users (admin only) |

### Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | Get all properties |
| GET | `/api/properties/:id` | Get property by ID |
| POST | `/api/properties` | Create property (admin) |
| PUT | `/api/properties/:id` | Update property (admin) |
| DELETE | `/api/properties/:id` | Delete property (admin) |
| GET | `/api/properties/search` | Search properties |

### Building Materials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | Get all materials |
| GET | `/api/materials/:id` | Get material by ID |
| GET | `/api/materials/categories/list` | Get categories |
| POST | `/api/materials` | Create material (admin) |
| PUT | `/api/materials/:id` | Update material (admin) |
| DELETE | `/api/materials/:id` | Delete material (admin) |

### Contact Form

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contact` | Get all submissions (admin) |
| GET | `/api/contact/:id` | Get submission by ID (admin) |
| POST | `/api/contact` | Submit contact form |
| PATCH | `/api/contact/:id` | Update status (admin) |
| DELETE | `/api/contact/:id` | Delete submission (admin) |

### Newsletter

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/newsletter` | Get all subscribers (admin) |
| POST | `/api/newsletter/subscribe` | Subscribe to newsletter |
| POST | `/api/newsletter/unsubscribe` | Unsubscribe from newsletter |
| GET | `/api/newsletter/stats` | Get subscriber count (admin) |

## Using the API

### Example: Login

```
bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@terracore.com","password":"admin123"}'
```

### Example: Get Properties

```
bash
curl http://localhost:3000/api/properties
```

### Example: Submit Contact Form

```
bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "phone":"+2348123456789",
    "subject":"Property Inquiry",
    "message":"I'm interested in the Transekulu property"
  }'
```

### Example: Subscribe to Newsletter

```
bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"subscriber@example.com"}'
```

## Database

The database is automatically created when the server starts. It's stored in `backend/terracore.db`.

### Tables

- `users` - User accounts
- `properties` - Property listings
- `materials` - Building materials
- `contacts` - Contact form submissions
- `newsletter` - Newsletter subscribers
- `testimonials` - Client testimonials

## Project Structure

```
backend/
├── .env                 # Environment variables
├── database.js          # Database setup
├── package.json         # Dependencies
├── README.md           # This file
├── server.js           # Main entry point
└── routes/
    ├── auth.js         # Authentication routes
    ├── contact.js      # Contact form routes
    ├── materials.js    # Building materials routes
    ├── newsletter.js   # Newsletter routes
    └── properties.js   # Properties routes
```

## License

Copyright © 2026 TerraCore Solutions. All rights reserved.
