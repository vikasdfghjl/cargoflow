# CargoFlow Backend Testing Suite

This document provides comprehensive information about the testing strategy, setup, and execution for the CargoFlow Backend API.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Strategy](#testing-strategy)
- [Test Structure](#test-structure)
- [Setup & Installation](#setup--installation)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The CargoFlow backend employs a comprehensive testing strategy using **Jest** as the primary testing framework, complemented by **Supertest** for HTTP integration testing and **MongoDB Memory Server** for database testing isolation.

### Test Statistics
- **Unit Tests**: 25+ test suites covering services, utilities, and middleware
- **Integration Tests**: 15+ test suites covering API endpoints and database operations  
- **E2E Tests**: 10+ comprehensive workflow tests
- **Coverage Target**: >90% code coverage

## 🏗️ Testing Strategy

### 1. **Unit Tests**
- **Purpose**: Test individual functions and modules in isolation
- **Framework**: Jest
- **Coverage**: Services, utilities, middleware, and helper functions
- **Isolation**: Mock external dependencies and database calls

### 2. **Integration Tests**
- **Purpose**: Test interaction between different layers (controller → service → database)
- **Framework**: Jest + Supertest
- **Coverage**: API endpoints, database operations, middleware chains
- **Database**: In-memory MongoDB instance

### 3. **End-to-End (E2E) Tests**
- **Purpose**: Test complete user workflows through the API
- **Framework**: Jest + Supertest  
- **Coverage**: Complete business processes (registration → booking → status updates)
- **Environment**: Dedicated test database

## 📁 Test Structure

```
backend/
├── tests/
│   ├── setup.ts                    # Global test configuration
│   ├── utils/
│   │   └── testHelpers.ts         # Test utility functions
│   ├── unit/                      # Unit tests
│   │   ├── services/
│   │   │   ├── AuthService.test.ts
│   │   │   ├── BookingService.test.ts
│   │   │   └── AddressService.test.ts
│   │   ├── middleware/
│   │   │   └── auth.test.ts
│   │   └── config/
│   │       └── database.test.ts
│   ├── integration/               # Integration tests
│   │   └── controllers/
│   │       ├── authController.test.ts
│   │       ├── bookingController.test.ts
│   │       └── addressController.test.ts
│   └── e2e/                      # End-to-end tests
│       └── api.test.ts
├── jest.config.json              # Jest configuration
├── .env.test                     # Test environment variables
└── run-tests.js                  # Test runner script
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (for local testing)
- npm or yarn package manager

### Installation
```bash
# Install dependencies
npm install

# Install test-specific dependencies (if not already included)
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

### Environment Setup
```bash
# Copy test environment file
cp .env.test.example .env.test

# Edit test environment variables as needed
# Default test configuration should work out of the box
```

## 🧪 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test categories  
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### Advanced Test Runner
```bash
# Use the custom test runner for enhanced output
node run-tests.js

# Run specific test types
node run-tests.js --unit
node run-tests.js --integration  
node run-tests.js --e2e
node run-tests.js --coverage

# Get help
node run-tests.js --help
```

### Individual Test Files
```bash
# Run specific test file
npx jest tests/unit/services/AuthService.test.ts

# Run tests matching pattern
npx jest --testNamePattern="should authenticate"

# Run tests in specific directory
npx jest tests/unit/services/
```

## 📊 Test Categories

### Unit Tests (`tests/unit/`)

#### Services Tests
- **AuthService**: User registration, login, profile management
- **BookingService**: Booking CRUD operations, status updates, statistics  
- **AddressService**: Address management, default address handling

#### Middleware Tests
- **Authentication**: JWT token validation, user context setting
- **Authorization**: Role-based access control
- **Error Handling**: Error response formatting, status codes

#### Configuration Tests
- **Database**: Connection handling, error scenarios, operations

### Integration Tests (`tests/integration/`)

#### Controller Tests
- **Auth Controller**: Registration, login, profile endpoints
- **Booking Controller**: Booking management endpoints
- **Address Controller**: Address CRUD endpoints

**Features Tested:**
- Request/response flow
- Authentication middleware integration
- Input validation
- Error responses
- Database operations

### E2E Tests (`tests/e2e/`)

#### Complete Workflows
- **Customer Journey**: Registration → Address Creation → Booking → Tracking
- **Admin Workflow**: Login → Booking Management → Status Updates → Analytics
- **Error Scenarios**: Invalid data, unauthorized access, not found cases

## ✍️ Writing Tests

### Test File Template
```typescript
import { TestHelpers } from '../../utils/testHelpers';
import ServiceClass from '../../../src/services/ServiceClass';

describe('ServiceClass Unit Tests', () => {
  let testData: any;

  beforeEach(() => {
    testData = TestHelpers.createTestData();
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      const input = TestHelpers.createTestInput();

      // Act  
      const result = await ServiceClass.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.property).toBe(expectedValue);
    });

    it('should handle error case', async () => {
      // Arrange
      const invalidInput = TestHelpers.createInvalidInput();

      // Act & Assert
      await expect(ServiceClass.methodName(invalidInput))
        .rejects.toThrow(ExpectedError);
    });
  });
});
```

### Test Helpers Usage
```typescript
// Generate test data
const userData = TestHelpers.createTestUserData({
  email: TestHelpers.generateRandomEmail(),
  userType: 'customer'
});

// Generate authentication token
const token = TestHelpers.generateTestToken(userId, 'admin');

// Create authorization header
const headers = TestHelpers.createAuthHeader(token);
```

### Integration Test Pattern
```typescript
import request from 'supertest';
import app from '../../../src/index';

describe('API Endpoint Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test user and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUserData);
    authToken = response.body.data.token;
  });

  it('should handle authenticated request', async () => {
    const response = await request(app)
      .get('/api/protected-route')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## 📈 Coverage Reports

### Generating Reports
```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
# Windows
start coverage/lcov-report/index.html

# macOS  
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

### Coverage Targets
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%  
- **Lines**: >90%

### Coverage Configuration
```json
{
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 85,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: node run-tests.js
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint",
      "pre-push": "npm run test"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Error: MongoMemoryServer failed to start
# Solution: Ensure MongoDB is installed locally or update test setup

# For Windows users, install MongoDB Community Edition
# Or use Docker:
docker run -d -p 27017:27017 mongo:latest
```

#### 2. Port Already in Use
```bash
# Error: Port 5001 already in use
# Solution: Change test port in .env.test
PORT=5002
```

#### 3. JWT Secret Issues
```bash
# Error: JWT_SECRET is not defined
# Solution: Ensure .env.test has JWT_SECRET defined
JWT_SECRET=test-jwt-secret-key
```

#### 4. Test Timeout Issues
```bash
# Error: Test timeout
# Solution: Increase timeout in jest.config.json
{
  "testTimeout": 30000
}
```

### Debug Mode
```bash
# Run tests with debug information
DEBUG=* npm test

# Run single test file with detailed output
npx jest --verbose tests/unit/services/AuthService.test.ts
```

### Test Data Cleanup
```bash
# If tests are interfering with each other:
# 1. Check beforeEach/afterEach cleanup
# 2. Ensure test isolation
# 3. Clear test database between runs

# Manual cleanup
npm run test:cleanup
```

## 📚 Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Data Management
- Use TestHelpers for consistent test data generation
- Avoid hardcoded values; use generated data
- Clean up test data after each test

### 3. Mocking Strategy
- Mock external services and APIs
- Use real database for integration tests (with cleanup)
- Mock authentication for unit tests, use real auth for integration

### 4. Error Testing
- Test both success and failure scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

### 5. Performance
- Keep unit tests fast (< 100ms each)
- Limit database operations in unit tests
- Use parallel test execution where possible

## 🎯 Testing Checklist

Before submitting code, ensure:

- [ ] All new functions have unit tests
- [ ] API endpoints have integration tests
- [ ] Critical workflows have E2E tests
- [ ] Tests cover both success and error scenarios
- [ ] Coverage thresholds are met
- [ ] Tests pass in CI/CD environment
- [ ] No test data leakage between tests
- [ ] Descriptive test names and good documentation

---

## 📞 Support

For testing-related questions or issues:

1. Check this documentation first
2. Review existing test files for patterns
3. Check the project's issue tracker
4. Contact the development team

**Happy Testing!** 🚀
