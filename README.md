# Cargo Pathway Pro - B2B Transport & Logistics Platform

A comprehensive B2B transport and logistics management platform built with modern web technologies. This full-stack application provides complete booking management, real-time tracking, and administrative capabilities for logistics companies.

## 🚀 Features

### Customer Portal
- **Booking Management**: Create, track, and manage transport bookings
- **Address Management**: Save and manage pickup/delivery addresses
- **Real-time Tracking**: Track shipments with live status updates
- **Invoice Management**: View and download booking invoices
- **Profile Management**: Manage account details and preferences

### Admin Dashboard
- **Booking Overview**: Comprehensive booking management with statistics
- **Customer Management**: User account management and analytics
- **Driver Management**: Driver assignment and performance tracking
- **Analytics Dashboard**: Real-time business metrics and insights
- **Status Management**: Update booking statuses and assign drivers

### Technical Features
- **Centralized Error Handling**: Comprehensive error management system
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Customer and admin role separation
- **RESTful API**: Clean and consistent API design
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first responsive interface

## 🛠️ Technology Stack

### Frontend (Port 3000)
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** + **shadcn/ui** for modern UI
- **React Router DOM v6** for navigation
- **TanStack Query** for server state management
- **React Hook Form** with validation
- **Centralized API Service** for consistent data fetching

### Backend (Port 5000)
- **Node.js** with **Express.js**
- **TypeScript** for full type safety
- **MongoDB** with **Mongoose ODM**
- **JWT** authentication with bcryptjs
- **Centralized Error Handling** middleware
- **Rate Limiting** and security middleware
- **Comprehensive Logging** system

## 🏗️ Architecture

### Project Structure
```
cargo-pathway-pro/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   ├── customer/        # Customer portal components
│   │   │   └── ui/              # shadcn/ui component library
│   │   ├── contexts/            # React contexts (Auth, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and API service
│   │   ├── pages/               # Route components
│   │   ├── services/            # Business logic services
│   │   └── types/               # TypeScript type definitions
│   └── package.json
├── backend/                     # Node.js backend API
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # MongoDB schemas
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic services
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Utility functions
│   └── package.json
├── ERROR_HANDLING.md           # Error handling documentation
├── INTEGRATION_SUMMARY.md      # Integration overview
├── STATELESS_ARCHITECTURE.md  # Architecture documentation
└── README.md                   # This file
```

### API Endpoints
```
/api/v1/auth/
├── POST /register              # User registration
├── POST /login                 # User authentication
├── POST /logout                # User logout
└── GET /profile                # Get user profile

/api/v1/bookings/
├── POST /                      # Create new booking
├── GET /                       # Get user bookings
├── GET /admin                  # Get all bookings (admin)
├── GET /:id                    # Get specific booking
├── PATCH /admin/:id/status     # Update booking status
├── POST /draft                 # Save booking draft
├── GET /draft                  # Get saved drafts
└── DELETE /draft/:id           # Delete draft

/api/v1/addresses/
├── GET /                       # Get user addresses
├── POST /                      # Save new address
├── PUT /:id                    # Update address
└── DELETE /:id                 # Delete address
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)
- **Git** for version control

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/vikasdfghjl/cargo-pathway-pro.git
cd cargo-pathway-pro

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Setup frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cargoflow
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
```

### 3. Database Setup

The application will automatically connect to MongoDB and create necessary collections on first run.

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔐 Authentication & Authorization

### User Types
- **Customer**: Can create bookings, track shipments, manage profile
- **Admin**: Full system access, user management, booking oversight

### Authentication Flow
1. User registers/logs in with email and password
2. Server returns JWT token (7-day expiry)
3. Token stored in localStorage and sent with API requests
4. Protected routes validated with middleware

### Security Features
- Password hashing with bcryptjs (12 salt rounds)
- JWT token validation and expiry
- Role-based route protection
- Rate limiting on API endpoints
- CORS configuration
- Security headers with Helmet

## 📊 Error Handling System

The backend implements a comprehensive centralized error handling system:

### Features
- **Custom Error Classes**: ValidationError, AuthenticationError, NotFoundError, etc.
- **Async Handler Wrapper**: Automatically catches and forwards errors
- **Mongoose Error Handling**: Proper handling of DB validation and cast errors
- **JWT Error Handling**: Token validation and expiry error management
- **Enhanced Logging**: Detailed error logging with request context
- **Development vs Production**: Different error detail levels

### Usage Example
```typescript
import { asyncHandler, ValidationError } from '../middleware/errorHandler';

export const createBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { pickupAddress, deliveryAddress } = req.body;
  
  if (!pickupAddress || !deliveryAddress) {
    throw new ValidationError('Pickup and delivery addresses are required');
  }
  
  // Business logic here - errors automatically caught and handled
});
```

## 🧪 Testing the Application

### Manual Testing Workflow

1. **Registration/Login**
   ```bash
   # Register new customer
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"firstName":"John","lastName":"Doe","email":"john@test.com","password":"password123","userType":"customer"}'
   ```

2. **Create Booking**
   - Login to get JWT token
   - Use customer portal to create test booking
   - Verify booking appears in admin dashboard

3. **Admin Operations**
   - Login as admin user
   - View all bookings with statistics
   - Update booking statuses
   - Manage customers

### Test Data
The system generates realistic test data including:
- Booking numbers (format: CB-YYYYMMDD-XXXX)
- Tracking numbers
- Address validation
- Price calculations

## 🔧 Development Scripts

### Backend Scripts
```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run test suite (when implemented)
```

### Frontend Scripts
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📈 Performance & Scalability

### Backend Optimizations
- **Mongoose Indexing**: Optimized database queries
- **Pagination**: Efficient data loading for large datasets
- **Rate Limiting**: Prevents API abuse
- **Compression**: Gzip compression for responses
- **Caching Headers**: Appropriate cache control

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Optimized asset loading
- **Bundle Analysis**: Build size monitoring

## 🔄 Current Status

### ✅ Completed Features
- Full-stack application architecture
- User authentication and authorization
- Customer booking management
- Admin dashboard with statistics
- Real-time booking tracking
- Address management system
- Centralized error handling
- Responsive UI/UX design
- API documentation
- Database integration

### 🚧 In Progress
- Enhanced testing suite
- Email notifications
- File upload capabilities
- Advanced analytics

### 📋 Planned Features
- SMS notifications
- Real-time GPS tracking
- Mobile application
- Payment gateway integration
- Multi-language support
- Advanced reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the established coding patterns and conventions
4. Ensure TypeScript compliance
5. Test your changes thoroughly
6. Commit with descriptive messages
7. Push to your branch and create a Pull Request

### Development Guidelines
- Follow the coding instructions in `.github/copilot-instructions.md`
- Use TypeScript strictly (no `any` types)
- Follow established error handling patterns
- Maintain consistent API response formats
- Use the centralized API service for frontend requests

## 📚 Documentation

- [Error Handling Guide](./ERROR_HANDLING.md)
- [Integration Summary](./INTEGRATION_SUMMARY.md)
- [Stateless Architecture](./STATELESS_ARCHITECTURE.md)
- [API Documentation](./backend/src/routes/) - Inline documentation

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and URI is correct
2. **JWT Secret**: Use a secure secret key (minimum 32 characters)
3. **CORS Issues**: Verify CORS_ORIGIN matches frontend URL
4. **Port Conflicts**: Ensure ports 3000 and 5000 are available

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in backend `.env`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, questions, or contributions:
- Open an issue in the GitHub repository
- Contact the development team
- Check the documentation files for detailed guidance

---

**Built with ❤️ for modern logistics management**

---

**Built with ❤️ for modern logistics management**