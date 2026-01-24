# SaaS Platform - Complete API Reference

A comprehensive multi-tenant SaaS backend with Inventory, Hotel, and Expense management modules.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:generate
npm run prisma:migrate
npx prisma db seed

# Start server
npm run dev
```

Server runs on: `http://localhost:5000`

## 📦 What's Included

### Core Features
- ✅ **Multi-tenant Architecture** - Complete tenant isolation
- ✅ **2-Month Free Trial** - Auto-assigned on registration
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access** - Owner, Admin, Staff roles
- ✅ **Plan Limits** - Automatic enforcement (products, users, tables)

### Business Modules
1. **Inventory Management**
   - Product CRUD with SKU tracking
   - Stock adjustments (purchase/sale/adjustment/return)
   - Low-stock alerts
   - Inventory analytics

2. **Hotel & Table Management**
   - Table management with status tracking
   - Reservation system with conflict detection
   - Occupancy tracking
   - Hotel statistics

3. **Expense Tracking**
   - Expense CRUD with categorization
   - Date range filtering
   - Monthly analytics & trends
   - Category breakdowns

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create tenant + owner (auto trial) |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user + permissions |

### Tenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List all tenants (owner only) |
| GET | `/api/tenants/:id` | Get tenant details |
| PUT | `/api/tenants/:id` | Update tenant |
| PUT | `/api/tenants/:id/upgrade` | Upgrade plan |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user (owner/admin) |
| GET | `/api/users` | List tenant users |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user |
| PUT | `/api/users/:id/change-password` | Change password |

### Inventory Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inventory/products` | Create product |
| GET | `/api/inventory/products` | List products (filters: category, lowStock, search) |
| GET | `/api/inventory/products/:id` | Get product with history |
| PUT | `/api/inventory/products/:id` | Update product |
| DELETE | `/api/inventory/products/:id` | Delete product |
| POST | `/api/inventory/products/:id/stock` | Adjust stock |
| GET | `/api/inventory/low-stock` | Get low-stock products |
| GET | `/api/inventory/stats` | Get inventory statistics |
| GET | `/api/inventory/stock-history` | Get stock movements |

### Hotel Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hotel/tables` | Create table |
| GET | `/api/hotel/tables` | List tables (filters: status, floor, section) |
| GET | `/api/hotel/tables/:id` | Get table details |
| PUT | `/api/hotel/tables/:id` | Update table |
| DELETE | `/api/hotel/tables/:id` | Delete table |
| POST | `/api/hotel/reservations` | Create reservation |
| GET | `/api/hotel/reservations` | List reservations (filters: status, date, tableId) |
| GET | `/api/hotel/reservations/:id` | Get reservation details |
| PUT | `/api/hotel/reservations/:id` | Update reservation |
| DELETE | `/api/hotel/reservations/:id` | Cancel reservation |
| GET | `/api/hotel/stats` | Get hotel statistics |

### Expense Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | List expenses (filters: category, date range) |
| GET | `/api/expenses/:id` | Get expense details |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/summary` | Get expense summary & analytics |
| GET | `/api/expenses/categories` | Get all categories |

## 🔒 Authentication

All endpoints (except `/api/auth/register` and `/api/auth/login`) require:

```
Authorization: Bearer {your_jwt_token}
```

## 📊 Plan Limits

| Plan | Price | Products | Users | Tables |
|------|-------|----------|-------|--------|
| **Free Trial** | FREE (2 months) | 50 | 2 | 5 |
| **Basic** | $9.99/mo | 100 | 2 | 10 |
| **Pro** | $29.99/mo | 1000 | 10 | 50 |
| **Enterprise** | $99.99/mo | Unlimited | Unlimited | Unlimited |

Limits are automatically enforced. Upgrade via `/api/tenants/:id/upgrade`.

## 🧪 Testing

### Postman Collection
Import: `postman/saas-platform-complete.postman_collection.json`

### Environment Variables
- `base_url`: http://localhost:5000
- `auth_token`: (filled automatically)
- `tenant_id`: (filled automatically)

### Test Workflow
1. **Register** → Creates tenant with 2-month trial
2. **Login** → Get auth token
3. **Create Products** → Test inventory module
4. **Create Tables** → Test hotel module
5. **Add Expenses** → Test expense module
6. **Check Limits** → Try exceeding plan limits

## 🏗️ Architecture

```
├── prisma/
│   ├── schema.prisma      # Database schema (13 models)
│   └── seed.ts            # Seed data (plans, modules, permissions)
├── src/
│   ├── config/
│   │   └── database.ts    # Prisma client
│   ├── middleware/
│   │   ├── auth.ts        # JWT authentication
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/          # Authentication
│   │   ├── tenants/       # Tenant management
│   │   ├── users/         # User management
│   │   ├── inventory/     # Inventory module
│   │   ├── hotel/         # Hotel module
│   │   └── expenses/      # Expense module
│   ├── utils/
│   │   ├── jwt.ts         # JWT utilities
│   │   └── validators.ts  # Zod schemas
│   └── app.ts             # Express app
└── postman/               # API collections
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Testing**: Postman

## 📝 Documentation

- **API_DOCUMENTATION.md** - Complete API reference with examples
- **API_TESTING.md** - Detailed testing guide (legacy)
- **README.md** - This file

## 🎯 Next Steps

1. **Frontend Development** - Build Next.js admin panel and client app
2. **Landing Page Module** - Simple CMS for public pages
3. **Plan & Permission APIs** - Advanced permission management
4. **Billing Integration** - Stripe integration for subscriptions
5. **Email Notifications** - Trial expiry reminders
6. **Analytics Dashboard** - Business insights

## 📞 Support

For issues or questions, check the API documentation or test with Postman collections.

**Happy Building!** 🚀
