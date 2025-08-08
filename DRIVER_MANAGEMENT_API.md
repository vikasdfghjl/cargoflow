# Driver Management API Documentation

This document provides comprehensive information about the Driver Management functionality in the CargoFlow B2B platform.

## Overview

The Driver Management system allows administrators to manage drivers, their vehicles, availability, and performance through a RESTful API. The system supports full CRUD operations, location tracking, availability management, and performance analytics.

## API Endpoints

### Base URL
```
/api/v1/drivers
```

### Authentication
All driver management endpoints (except `GET /available`) require admin authentication:
```
Authorization: Bearer <admin_token>
```

## Driver Model

### Driver Schema
```typescript
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string; // Virtual field
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  experience: number; // in years
  rating: number; // 0-5
  totalDeliveries: number;
  status: 'active' | 'inactive' | 'suspended';
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number; // in kg
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  certifications: string[];
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: Date;
    availableTo?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### 1. Create Driver
**POST** `/api/v1/drivers`

Creates a new driver in the system.

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Driver",
  "email": "john.driver@example.com",
  "phone": "+1234567890",
  "licenseNumber": "DL123456789",
  "licenseExpiry": "2025-12-31T00:00:00.000Z",
  "experience": 5,
  "vehicle": {
    "number": "TRK001",
    "type": "truck",
    "model": "Ford Transit",
    "capacity": 1000
  },
  "certifications": ["Hazmat", "CDL"],
  "documents": {
    "license": "license-document-url",
    "insurance": "insurance-document-url",
    "registration": "registration-document-url"
  }
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "id": "64f123456789abcdef012345",
    "firstName": "John",
    "lastName": "Driver",
    "fullName": "John Driver",
    "email": "john.driver@example.com",
    // ... other driver fields
  }
}
```

### 2. Get All Drivers
**GET** `/api/v1/drivers`

Retrieves all drivers with filtering and pagination options.

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sortBy` (string): Sort field (default: 'createdAt')
- `sortOrder` ('asc' | 'desc'): Sort order (default: 'desc')
- `status` ('active' | 'inactive' | 'suspended'): Filter by status
- `vehicleType` ('truck' | 'van' | 'bike' | 'car'): Filter by vehicle type
- `isAvailable` (boolean): Filter by availability
- `minRating` (number): Minimum rating filter
- `minExperience` (number): Minimum experience filter
- `latitude` (number): Location filter latitude
- `longitude` (number): Location filter longitude
- `radius` (number): Location filter radius in km (default: 50)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": {
    "drivers": [
      {
        "id": "64f123456789abcdef012345",
        "firstName": "John",
        "lastName": "Driver",
        // ... other driver fields
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Driver by ID
**GET** `/api/v1/drivers/:driverId`

Retrieves a specific driver by their ID.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver retrieved successfully",
  "data": {
    "id": "64f123456789abcdef012345",
    "firstName": "John",
    "lastName": "Driver",
    // ... all driver fields
  }
}
```

### 4. Update Driver
**PUT** `/api/v1/drivers/:driverId`

Updates driver information.

#### Request Body (Partial Update)
```json
{
  "firstName": "Jane",
  "experience": 7,
  "vehicle": {
    "model": "Updated Model"
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver updated successfully",
  "data": {
    // Updated driver object
  }
}
```

### 5. Delete Driver
**DELETE** `/api/v1/drivers/:driverId`

Removes a driver from the system.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver deleted successfully",
  "data": {
    "message": "Driver deleted successfully"
  }
}
```

### 6. Update Driver Status
**PATCH** `/api/v1/drivers/:driverId/status`

Updates the driver's status.

#### Request Body
```json
{
  "status": "inactive"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver status updated successfully",
  "data": {
    // Updated driver object
  }
}
```

### 7. Update Driver Location
**PATCH** `/api/v1/drivers/:driverId/location`

Updates the driver's current location.

#### Request Body
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "New York, NY"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver location updated successfully",
  "data": {
    // Updated driver object
  }
}
```

### 8. Update Driver Availability
**PATCH** `/api/v1/drivers/:driverId/availability`

Updates the driver's availability status.

#### Request Body
```json
{
  "isAvailable": true,
  "availableFrom": "2024-01-01T09:00:00.000Z",
  "availableTo": "2024-01-01T17:00:00.000Z"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver availability updated successfully",
  "data": {
    // Updated driver object
  }
}
```

### 9. Get Available Drivers (Public Endpoint)
**GET** `/api/v1/drivers/available`

Retrieves available drivers near a specific location.

#### Query Parameters (Required)
- `latitude` (number): Location latitude
- `longitude` (number): Location longitude

#### Query Parameters (Optional)
- `vehicleType` (string): Filter by vehicle type
- `minCapacity` (number): Minimum vehicle capacity
- `radius` (number): Search radius in km (default: 50)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Available drivers retrieved successfully",
  "data": [
    {
      "id": "64f123456789abcdef012345",
      "firstName": "John",
      "lastName": "Driver",
      "rating": 4.5,
      "vehicle": {
        "type": "truck",
        "capacity": 1000
      },
      "currentLocation": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "New York, NY"
      }
    }
  ]
}
```

### 10. Get Driver Statistics
**GET** `/api/v1/drivers/statistics`

Retrieves overall driver statistics for dashboard.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver statistics retrieved successfully",
  "data": {
    "overview": {
      "totalDrivers": 150,
      "activeDrivers": 120,
      "availableDrivers": 80,
      "avgRating": 4.2,
      "totalDeliveries": 5000
    },
    "vehicleDistribution": {
      "truck": 60,
      "van": 40,
      "bike": 30,
      "car": 20
    }
  }
}
```

### 11. Assign Driver to Booking
**POST** `/api/v1/drivers/assign`

Assigns a driver to a specific booking.

#### Request Body
```json
{
  "driverId": "64f123456789abcdef012345",
  "bookingId": "64f123456789abcdef012346"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver assigned to booking successfully",
  "data": {
    "driverId": "64f123456789abcdef012345",
    "bookingId": "64f123456789abcdef012346",
    "assignedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 12. Get Driver Bookings
**GET** `/api/v1/drivers/:driverId/bookings`

Retrieves bookings assigned to a specific driver.

#### Query Parameters
- `status` (string): Filter by booking status
- `page` (number): Page number
- `limit` (number): Items per page

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver bookings retrieved successfully",
  "data": {
    "driverId": "64f123456789abcdef012345",
    "bookings": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalItems": 0,
      "itemsPerPage": 10
    }
  }
}
```

### 13. Get Driver Performance
**GET** `/api/v1/drivers/:driverId/performance`

Retrieves performance metrics for a specific driver.

#### Query Parameters
- `startDate` (string): Start date for metrics
- `endDate` (string): End date for metrics

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Driver performance retrieved successfully",
  "data": {
    "driverId": "64f123456789abcdef012345",
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "metrics": {
      "totalDeliveries": 25,
      "completedDeliveries": 23,
      "averageRating": 4.5,
      "onTimeDeliveryRate": 92,
      "customerSatisfactionScore": 4.3
    }
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error message",
  "error": "Detailed error information"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Driver not found"
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "message": "Driver with this email already exists"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Usage Examples

### Create a New Driver
```bash
curl -X POST http://localhost:5000/api/v1/drivers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Driver",
    "email": "john.driver@example.com",
    "phone": "+1234567890",
    "licenseNumber": "DL123456789",
    "licenseExpiry": "2025-12-31T00:00:00.000Z",
    "experience": 5,
    "vehicle": {
      "number": "TRK001",
      "type": "truck",
      "model": "Ford Transit",
      "capacity": 1000
    },
    "documents": {
      "license": "license-url",
      "insurance": "insurance-url",
      "registration": "registration-url"
    }
  }'
```

### Get Available Drivers Near Location
```bash
curl "http://localhost:5000/api/v1/drivers/available?latitude=40.7128&longitude=-74.0060&vehicleType=truck&minCapacity=500"
```

### Update Driver Status
```bash
curl -X PATCH http://localhost:5000/api/v1/drivers/64f123456789abcdef012345/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

## Integration with Frontend

The frontend should integrate these APIs to provide:

1. **Driver List View**: Use `GET /drivers` with pagination and filtering
2. **Driver Details**: Use `GET /drivers/:id` for detailed view
3. **Driver Creation**: Use `POST /drivers` with form validation
4. **Status Management**: Use `PATCH /drivers/:id/status` for quick status updates
5. **Location Tracking**: Use `PATCH /drivers/:id/location` for location updates
6. **Dashboard Statistics**: Use `GET /drivers/statistics` for admin dashboard

## Security Considerations

1. All driver management endpoints require admin authentication
2. Input validation is enforced on all fields
3. Unique constraints prevent duplicate emails, license numbers, and vehicle numbers
4. Rate limiting is applied to prevent abuse
5. Sensitive data is properly handled and secured

## Database Indexes

The following indexes are created for optimal performance:

```javascript
// Compound indexes for efficient queries
{ status: 1, 'availability.isAvailable': 1 }
{ rating: -1, totalDeliveries: -1 }
{ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 }
{ 'vehicle.type': 1, 'vehicle.capacity': 1 }

// Unique indexes
{ email: 1 }
{ licenseNumber: 1 }
{ 'vehicle.number': 1 }
```

## Future Enhancements

1. **Real-time Location Tracking**: WebSocket integration for live location updates
2. **Route Optimization**: Integration with mapping services for optimal route planning
3. **Performance Analytics**: Advanced analytics for driver performance metrics
4. **Notification System**: Real-time notifications for driver assignments and updates
5. **Mobile App Integration**: APIs for driver mobile application
6. **Document Management**: File upload and management for driver documents
7. **Geofencing**: Location-based alerts and automation
