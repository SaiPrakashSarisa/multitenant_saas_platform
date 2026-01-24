# Multi-Tenant SaaS Platform - Complete API Documentation

## 📋 Table of Contents
- [Setup](#setup)
- [Authentication](#authentication)
- [Tenants](#tenants)
- [Users](#users)
- [Inventory Module](#inventory-module)
- [Hotel Module](#hotel-module)
- [Expense Module](#expense-module)

---

## Setup

### Prerequisites
1. PostgreSQL running on localhost:5432
2. Update `.env` with your database credentials
3. Run migrations and seed:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npx prisma db seed
   npm run dev
   ```

### Import Postman Collection
Import `postman/saas-platform-complete.postman_collection.json`

### Environment Variables
Set in Postman:
- `base_url`: http://localhost:5000
- `auth_token`: (auto-filled after login)
- `tenant_id`: (auto-filled after registration)

---

## Authentication

### Register (Creates Tenant + Owner)
**POST** `/api/auth/register`

**Auto-assigns 2-month free trial!**

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

### Login
**POST** `/api/auth/login`

```json
{
  "email": "owner@abc.com",
  "password": "password123"
}
```

### Get Current User
**GET** `/api/auth/me`

Headers: `Authorization: Bearer {token}`

---

## Inventory Module

### Create Product
**POST** `/api/inventory/products`

```json
{
  "name": "Laptop Stand",
  "sku": "LS-001",
  "description": "Adjustable aluminum laptop stand",
  "price": 49.99,
  "stockQuantity": 25,
  "lowStockThreshold": 5,
  "category": "Accessories"
}
```

**Plan Limits Enforced**: Free Trial allows 50 products max.

### Get All Products
**GET** `/api/inventory/products?page=1&limit=20&category=Accessories&lowStock=true&search=laptop`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `lowStock`: true to show only low-stock items
- `search`: Search in name/SKU/description

### Adjust Stock
**POST** `/api/inventory/products/{id}/stock`

```json
{
  "quantity": -5,
  "movementType": "adjustment",
  "notes": "5 units damaged during inspection"
}
```

**Movement Types**:
- `purchase`: Adding stock (+)
- `sale`: Stock sold (-)
- `adjustment`: Manual correction (+ or -)
- `return`: Items returned (+)

### Get Low Stock Products
**GET** `/api/inventory/low-stock`

Returns all products where `stockQuantity <= lowStockThreshold`

### Get Inventory Statistics
**GET** `/api/inventory/stats`

Response:
```json
{
  "totalProducts": 150,
  "lowStockCount": 12,
  "totalStockUnits": 2500,
  "categoryCounts": [
    { "category": "Accessories", "count": 45 },
    { "category": "Electronics", "count": 105 }
  ]
}
```

### Get Stock Movement History
**GET** `/api/inventory/stock-history?productId={id}&page=1&limit=20`

Full audit trail of all stock movements.

---

## Hotel Module

### Create Table
**POST** `/api/hotel/tables`

```json
{
  "tableNumber": "T-101",
  "capacity": 4,
  "floor": "Ground",
  "section": "Window Side"
}
```

**Plan Limits**: Free Trial allows 5 tables, Basic: 10, Pro: 50

### Update Table Status
**PUT** `/api/hotel/tables/{id}`

```json
{
  "status": "occupied"
}
```

**Statuses**: `available`, `occupied`, `reserved`, `maintenance`

### Get All Tables
**GET** `/api/hotel/tables?status=available&floor=Ground&section=Window%20Side`

Includes next upcoming reservation for each table.

### Create Reservation
**POST** `/api/hotel/reservations`

```json
{
  "tableId": "uuid-of-table",
  "customerName": "Jane Smith",
  "customerPhone": "+1-555-0123",
  "customerEmail": "jane@example.com",
  "reservationTime": "2026-01-25T19:00:00Z",
  "partySize": 4,
  "specialRequests": "Window seat preferred"
}
```

**Conflict Detection**: Automatically checks for overlapping reservations (1 hour buffer).

### Get Reservations
**GET** `/api/hotel/reservations?status=confirmed&date=2026-01-25&tableId={id}`

Filter by:
- `status`: pending, confirmed, completed, cancelled, no-show
- `date`: Get reservations for specific date
- `tableId`: Filter by specific table

### Update Reservation
**PUT** `/api/hotel/reservations/{id}`

```json
{
  "status": "confirmed",
  "partySize": 6
}
```

### Get Hotel Statistics
**GET** `/api/hotel/stats`

```json
{
  "totalTables": 20,
  "availableTables": 15,
  "occupiedTables": 3,
  "reservedTables": 2,
  "todayReservations": 12,
  "occupancyRate": 15.0
}
```

---

## Expense Module

### Create Expense
**POST** `/api/expenses`

```json
{
  "category": "utilities",
  "amount": 450.00,
  "description": "Monthly electricity bill",
  "date": "2026-01-23",
  "receiptUrl": "https://example.com/receipt.pdf"
}
```

**Common Categories**: rent, utilities, supplies, salaries, marketing, other

### Get Expenses
**GET** `/api/expenses?page=1&category=utilities&startDate=2026-01-01&endDate=2026-01-31`

Filter by:
- `category`: Filter by expense category
- `startDate` & `endDate`: Date range filter

### Get Expense Summary
**GET** `/api/expenses/summary?startDate=2026-01-01&endDate=2026-01-31`

```json
{
  "totalAmount": 12500.50,
  "totalCount": 45,
  "byCategory": [
    { "category": "rent", "total": 5000, "count": 1 },
    { "category": "utilities", "total": 1200.50, "count": 3 },
    { "category": "salaries", "total": 6000, "count": 5 }
  ],
  "monthlyTrend": [
    { "month": "2026-01", "total": "12500.50" },
    { "month": "2025-12", "total": "11800.20" }
  ]
}
```

### Get Expense Categories
**GET** `/api/expenses/categories`

Returns all unique categories used by the tenant.

---

## Error Responses

### 400 - Validation Error
```json
{
  "error": "Validation Error",
  "details": [
    { "field": "email", "message": "Invalid email address" }
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

### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 409 - Conflict
```json
{
  "error": "Conflict",
  "message": "slug already exists"
}
```

### Plan Limit Error
```json
{
  "error": "Product limit reached. Your Free Trial (2 Months) allows 50 products. Please upgrade your plan."
}
```

---

## Testing Workflow

### 1. Register & Setup
1. Register a new tenant → Save `auth_token` and `tenant_id`
2. Verify trial plan: Check `/api/auth/me`

### 2. Test Inventory Module
1. Create 3-5 products
2. Adjust stock (test purchase, sale, adjustment)
3. Check low-stock alerts
4. View inventory stats

### 3. Test Hotel Module
1. Create 3-5 tables
2. Create reservations for different times
3. Test conflict detection (try overlapping reservations)
4. Update table statuses
5. View hotel stats

### 4. Test Expense Module
1. Add expenses in different categories
2. Test date range filtering
3. View expense summary
4. Check category breakdown

### 5. Test Plan Limits
1. Try creating more items than plan allows
2. Verify error messages
3. Test upgrade plan endpoint

---

## Quick Reference

| Module | Base Path | Key Features |
|--------|-----------|--------------|
| Auth | `/api/auth` | Register, Login, Profile |
| Tenants | `/api/tenants` | CRUD, Plan Upgrade |
| Users | `/api/users` | User Management, Roles |
| Inventory | `/api/inventory` | Products, Stock, Analytics |
| Hotel | `/api/hotel` | Tables, Reservations, Stats |
| Expenses | `/api/expenses` | Expense Tracking, Summaries |

**All endpoints (except auth) require**: `Authorization: Bearer {token}` header

**All modules enforce plan limits** and provide detailed error messages.
