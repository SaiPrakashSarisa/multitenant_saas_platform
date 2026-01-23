# API Testing Guide

## Prerequisites

Before testing the APIs, ensure:

1. **PostgreSQL is running** and database is created
2. **Database is migrated and seeded**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npx prisma db seed
   ```
3. **Server is running**:
   ```bash
   npm run dev
   ```

## Postman Collection

Import the Postman collection: `postman/core-apis.postman_collection.json`

### Environment Variables

Set these variables in Postman:
- `base_url`: `http://localhost:5000`
- `auth_token`: (will be filled after login)
- `tenant_id`: (will be filled after registration)
- `plan_id`: (get from database or seed output)

## Testing Flow

### 1. Register New Tenant (Auto 2-Month Trial)

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "tenantName": "ABC Store",
  "slug": "abc-store",
  "businessType": "inventory",
  "email": "owner@abc.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Registration successful! Your 2-month free trial has started.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "owner@abc.com",
      "role": "owner",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tenant": {
      "id": "uuid",
      "name": "ABC Store",
      "slug": "abc-store",
      "businessType": "inventory",
      "status": "trial",
      "trialEndDate": "2026-03-24T..."
    }
  }
}
```

**Save** the `token` and `tenant.id` for next requests!

---

### 2. Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "owner@abc.com",
  "password": "password123"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "...",
    "user": {...},
    "tenant": {
      "status": "trial",
      "plan": "Free Trial (2 Months)",
      "trialEndDate": "..."
    }
  }
}
```

---

### 3. Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer {token}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tenant": {...},
    "enabledModules": [
      {
        "id": "uuid",
        "name": "inventory",
        "displayName": "Inventory Management"
      },
      ...
    ],
    "permissions": [
      "inventory.view",
      "inventory.create",
      ...
    ]
  }
}
```

---

### 4. Get Tenant Details

**Endpoint**: `GET /api/tenants/{tenant_id}`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC Store",
    "status": "trial",
    "plan": {...},
    "daysRemaining": 60,
    "_count": {
      "users": 1,
      "products": 0,
      "hotelTables": 0
    }
  }
}
```

---

### 5. Upgrade Plan

**Endpoint**: `PUT /api/tenants/{tenant_id}/upgrade`

**Request Body**:
```json
{
  "planId": "uuid-of-basic-plan"
}
```

**Get Plan IDs**:
```bash
# Open Prisma Studio
npm run prisma:studio

# Navigate to "plans" table and copy a plan ID
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Plan upgraded successfully! Welcome to your new plan.",
  "data": {
    "status": "active",
    "trialConverted": true,
    "plan": {
      "name": "basic",
      "displayName": "Basic Plan"
    }
  }
}
```

---

## 6. User Management

### Create User (Owner/Admin only)

**Endpoint**: `POST /api/users`

**Request Body**:
```json
{
  "email": "staff@abc.com",
  "password": "password123",
  "role": "staff",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "staff@abc.com",
    "role": "staff",
    "firstName": "Jane",
    "lastName": "Smith",
    "isActive": true,
    "createdAt": "..."
  }
}
```

**Note**: This endpoint checks plan limits. If you're on the Free Trial (2 users max), creating a 3rd user will fail with:
```json
{
  "error": "User limit reached. Your Free Trial (2 Months) allows 2 users. Please upgrade your plan."
}
```

---

### Get All Users

**Endpoint**: `GET /api/users?page=1&limit=10`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### Update User

**Endpoint**: `PUT /api/users/{user_id}`

**Request Body**:
```json
{
  "role": "admin",
  "firstName": "Jane Updated"
}
```

**Note**: Cannot modify owner user. Will return error if attempted.

---

### Deactivate User

**Endpoint**: `DELETE /api/users/{user_id}`

**Expected Response**:
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

**Note**: This is a soft delete. User is deactivated, not permanently deleted.

---

### Change Password

**Endpoint**: `PUT /api/users/{user_id}/change-password`

**Request Body**:
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Note**: Users can only change their own password.

---

## Common Errors

### 400 - Validation Error
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 409 - Conflict
```json
{
  "error": "Conflict",
  "message": "slug already exists"
}
```

### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

---

## What's Working

✅ User registration with auto trial assignment  
✅ JWT authentication  
✅ Tenant creation with all modules enabled  
✅ Login with trial expiry check  
✅ User profile with permissions  
✅ Tenant CRUD operations  
✅ Plan upgrades  
✅ Role-based authorization  
✅ User management (Create, Read, Update, Deactivate)  
✅ Plan limit enforcement (user limits)  
✅ Password management  

## Next Steps

- Build Plan & Permission APIs  
- Build Module-specific APIs (Inventory, Hotel, etc.)
