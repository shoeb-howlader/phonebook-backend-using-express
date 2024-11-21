# Contact Management Backend

## Overview
This is a Node.js backend application for a contact management system built with Express.js, MongoDB, and JWT authentication. The compiled frontend from a Vue 3 and Vuetify 3 project is served from the `public` folder.

## Frontend Repository
- **Frontend Project:** [Phonebook Vue3 Vuetify3](https://github.com/shoeb-howlader/phonebook-using-vue3-vuetify3)
- **Repository URL:** https://github.com/shoeb-howlader/phonebook-using-vue3-vuetify3.git
- Tech Stack: Vue 3, Vuetify 3
- Compiled frontend files copied to `public` folder for serving

## Features
- User authentication with JWT
- CRUD operations for contacts
- Image upload functionality for contact profiles
- Secure admin access with authentication middleware
- Frontend served directly from the application

## Prerequisites
- Node.js (v14 or later)
- MongoDB
- npm (Node Package Manager)

## Installation

1. Clone the repository
```bash
git clone <your-repository-url>
cd <project-directory>
```

2. Install dependencies
```bash
npm install
```

3. Set up MongoDB
- Ensure MongoDB is running locally on port 27017
- The application will connect to a database named `contacts_db`

4. Configure Environment
- Replace `JWT_SECRET` in the code with a strong, unique secret key
- Modify default admin credentials in the `setupInitialAdmin()` function if needed

## Running the Application
```bash
node server.js
```

## Accessing the Application
- **Frontend:** Open `http://localhost:3001` in your web browser
- **Backend API:** Accessible at `http://localhost:3001/api/*`

## Default Admin Credentials
- **Username:** `admin`
- **Password:** `adminPassword123!`

## API Endpoints

### Authentication
- `POST /api/login`: Authenticate admin user

### Contacts
- `GET /api/contacts`: Retrieve all contacts
- `GET /api/contacts/:id`: Retrieve a specific contact (admin only)
- `POST /api/contacts`: Create a new contact (admin only)
- `PUT /api/contacts/:id`: Update a contact (admin only)
- `DELETE /api/contacts/:id`: Delete a contact (admin only)

## Important Security Notes
- Change default admin credentials immediately after first login
- Use a strong, unique JWT secret in production
- Implement additional security measures as needed

## Project Structure
- `server.js`: Main server file
- `public/`: Compiled Vue 3 frontend files
- `uploads/`: Directory for contact profile images
- `models/`: Mongoose schema definitions
- Middleware for authentication and error handling included

## Frontend Serving
- The `public` folder contains the compiled frontend from Vue 3 project
- Served automatically when you run `node server.js`
- Accessible at `http://localhost:3001`

## Error Handling
- Global error handler implemented
- Specific error responses for different scenarios

## Contributions
Please open an issue or submit a pull request for any improvements or bug fixes.



## Development
To start developing:
1. Ensure all prerequisites are installed
2. Run `npm install` to get dependencies
3. Configure your MongoDB connection
4. Run the server with `node server.js`
5. Access the application at `http://localhost:3001`

## License

MIT License

Copyright (c) 2024 Md Shoeb Howlader

