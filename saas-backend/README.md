# Multi-Tenant SaaS Platform - Backend

A modular multi-tenant SaaS backend supporting diverse business types (Inventory, Hotel, Landing Page, Expenses).

## 🚀 Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript
- **Auth**: JWT + bcrypt

## 📋 Prerequisites

- Node.js v20 or higher
- PostgreSQL database
- npm or yarn

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/saas_platform?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data (plans, modules, permissions)
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📚 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## 🏗️ Project Structure

```
src/
├── config/          # Database and app configuration
├── middleware/      # Auth, tenant context, error handlers
├── modules/
│   ├── auth/        # Authentication APIs
│   ├── tenants/     # Tenant management
│   ├── users/       # User management
│   ├── inventory/   # Inventory module
│   ├── hotel/       # Hotel module
│   ├── expenses/    # Expense tracking
│   └── landing/     # Landing page builder
├── utils/           # Helper functions
└── app.ts           # Main application entry
```

## 🗄️ Database Schema

### Core Tables
- **tenants** - Client businesses
- **users** - User accounts
- **plans** - Subscription plans (Basic, Pro, Enterprise)
- **modules** - Available features (Inventory, Hotel, etc.)
- **tenant_modules** - Module assignments per tenant
- **permissions** - Fine-grained access control

### Module Tables
- **products**, **stock_movements** - Inventory
- **hotel_tables**, **reservations** - Hotel
- **expenses** - Expense tracking
- **landing_pages**, **page_assets** - Landing page builder

## 🔑 API Endpoints (Coming Next)

- `/api/auth/*` - Authentication
- `/api/tenants/*` - Tenant management
- `/api/inventory/*` - Inventory module
- `/api/hotel/*` - Hotel module
- `/api/expenses/*` - Expense tracking
- `/api/landing-page/*` - Landing pages

## 📝 Next Steps

Phase 1 Complete ✅ - Database schema created

**Phase 2**: Build core APIs (Auth, Tenants, Users)
