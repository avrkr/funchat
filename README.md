# FunChat - Real-time Chat Application

FunChat is a modern real-time chat application built with React, Node.js, and Socket.IO, offering a seamless and interactive messaging experience.

## Features

- Real-time messaging
- User authentication
- Friend requests and management
- File and image sharing
- Profile customization
- Email verification
- Password reset functionality
- Online/offline status
- Message notifications

## Tech Stack

### Frontend
- React
- Vite
- Socket.IO Client
- TailwindCSS
- React Router
- Axios

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB
- JWT Authentication
- Cloudinary (for file storage)
- Nodemailer (for emails)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/funchat.git
cd funchat
```

2. Install dependencies for both frontend and backend:
```bash
# Frontend
cd funchatfrontend
npm install

# Backend
cd ../funchatbackend
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Fill in the required environment variables

4. Start the development servers:
```bash
# Backend
cd funchatbackend
npm run dev

# Frontend
cd funchatfrontend
npm run dev
```

## Environment Variables

### Frontend
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Backend
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

## Deployment

The application can be deployed using Vercel for both frontend and backend.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Socket.IO for real-time communication
- Cloudinary for file storage
- TailwindCSS for styling
- MongoDB for database