# bsc-project-source-code-files-2024-5-Abga001

# Template

HackGrad - Social Media Productivity Hub for Tech Students and Graduates
Project Overview
HackGrad is a full-stack web application designed to connect tech students and graduates, providing a platform for networking, skill showcasing, and community engagement. The platform combines features inspired by LinkedIn, GitHub, and popular social media platforms to create a comprehensive ecosystem for tech professionals.

Repository Structure
This repository contains both the frontend and backend components of the HackGrad platform:

HackGrad/
├── hackgradb/ # Backend (Node.js/Express/MongoDB)
│ ├── middleware/ # Authentication middleware
│ ├── models/ # MongoDB schemas
│ ├── routes/ # API endpoints
│ ├── uploads/ # User uploaded content
│ ├── utils/ # Utility functions
│ └── app.js # Main server file
│
└── hackgradf/ # Frontend (React.js)
├── public/ # Static assets
├── src/
│ ├── components/ # Reusable UI components
│ ├── Pages/ # Main page components
│ ├── styles/ # CSS stylesheets
│ └── firebaseConfig.js # Firebase configuration
└── package.json # Project dependencies

Technologies Used

Backend

Node.js & Express: Fast, unopinionated web framework
MongoDB: NoSQL database for flexible data storage
JWT: JSON Web Tokens for secure authentication
Multer: Middleware for handling file uploads
Firebase Admin: For real-time messaging features

Frontend

React.js: UI library for building component-based interfaces
React Router: For client-side routing
Firebase: Real-time database and authentication
Axios: Promise-based HTTP client
FontAwesome: Icon library
Custom CSS: Responsive design inspired by modern social platforms

Key Features

Responsive UI: Clean, user-friendly interface inspired by Instagram and Pinterest
Dynamic Feed: Multi-column content delivery showcasing jobs, projects, and tutorials
User Profiles: Customizable profiles to display skills, education, and portfolios
Authentication: Secure login/logout with JWT
Content Creation: Post various content types (projects, tutorials, jobs, events, sell old books, ask questions to others in your network)
Real-time Messaging: Connect with other professionals
CV Builder: Create and manage professional CVs

Tools and Utilities
Productivity tools including pomodoro timer, calendar, to do list, word counter, flash card generator, wage calculator

... Will update this later
