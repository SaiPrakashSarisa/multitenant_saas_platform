# Multi-Tenant SaaS Platform - Implementation Plan

A comprehensive backend-first approach to building a modular multi-tenant SaaS platform supporting diverse business types (Inventory, Hotel, Landing Page, Expenses).

---

## 🎯 Development Philosophy

**Backend First → API Testing → Frontend Last**

1. Design database schema with multi-tenancy
2. Build and test APIs with Postman
3. Build UI once backend is solid

---

## 📊 Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (with Row-Level Security)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod or Joi

### Frontend (Phase 5-6)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Query / SWR
- **UI Components**: Reusable design system

### DevOps & Tools
- **API Testing**: Postman
- **Version Control**: Git
- **Environment**: Docker (optional, for PostgreSQL)

---

## 🗂️ Phase 1: Database Schema & Foundation

**Duration**: 1-2 days  
**Goal**: Create a bulletproof multi-tenant database schema

### Step 1.1: Core Tables Design

#### Tenants Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(50) NOT NULL, -- 'inventory', 'hotel', 'landing', 'expense'
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'trial'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'owner', 'admin', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Plans Table
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'enterprise'
  price DECIMAL(10,2) NOT NULL,
  billing_cycle VARCHAR(20), -- 'monthly', 'yearly'
  features JSONB, -- Store plan limits: {"max_products": 100, "max_users": 5}
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Modules Table
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'inventory', 'hotel', 'expenses'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);
```

#### Tenant_Modules Table (Mapping)
```sql
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id),
  is_enabled BOOLEAN DEFAULT true,
  config JSONB, -- Module-specific settings
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, module_id)
);
```

#### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'inventory.create', 'hotel.view'
  module_id UUID REFERENCES modules(id),
  description TEXT,
  min_plan_level VARCHAR(20) -- 'basic', 'pro', 'enterprise'
);
```

#### Role_Permissions Table
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR(20) NOT NULL,
  permission_id UUID REFERENCES permissions(id),
  UNIQUE(tenant_id, role, permission_id)
);
```

### Step 1.2: Module-Specific Tables

#### Inventory Module
```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  category VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL, -- Positive for addition, negative for deduction
  movement_type VARCHAR(20), -- 'purchase', 'sale', 'adjustment'
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Hotel Module
```sql
-- Tables (Restaurant/Hotel)
CREATE TABLE hotel_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  table_number VARCHAR(20) NOT NULL,
  capacity INTEGER,
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'occupied', 'reserved'
  floor VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES hotel_tables(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  reservation_time TIMESTAMP,
  party_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Expense Module
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- 'rent', 'utilities', 'supplies'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Landing Page Module
```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content JSONB, -- Store page structure as JSON
  theme VARCHAR(50) DEFAULT 'default',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE page_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id),
  asset_type VARCHAR(20), -- 'image', 'video'
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### E-commerce Module
```sql
-- Product Categories
CREATE TABLE ecommerce_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES ecommerce_categories(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- E-commerce Products (extends base products for online selling)
CREATE TABLE ecommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ecommerce_categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- Original price for showing discounts
  cost_price DECIMAL(10,2), -- Cost for profit calculations
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  weight DECIMAL(8,2), -- For shipping calculations
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Product Images
CREATE TABLE ecommerce_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES ecommerce_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Variants (size, color, etc.)
CREATE TABLE ecommerce_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES ecommerce_products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "Small / Red"
  sku VARCHAR(100),
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  attributes JSONB, -- {"size": "S", "color": "Red"}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shopping Cart
CREATE TABLE ecommerce_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  session_id VARCHAR(255), -- For guest checkout
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'converted', 'abandoned'
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cart Items
CREATE TABLE ecommerce_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES ecommerce_carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES ecommerce_products(id),
  variant_id UUID REFERENCES ecommerce_product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Shipping Address
  shipping_name VARCHAR(255),
  shipping_address_line1 VARCHAR(255),
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  shipping_phone VARCHAR(20),
  
  -- Billing Address
  billing_name VARCHAR(255),
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  
  notes TEXT,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE ecommerce_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES ecommerce_products(id),
  variant_id UUID REFERENCES ecommerce_product_variants(id),
  product_name VARCHAR(255) NOT NULL, -- Snapshot of product name
  variant_name VARCHAR(100),
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discount Codes / Coupons
CREATE TABLE ecommerce_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Payment Records
CREATE TABLE ecommerce_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ecommerce_orders(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'cod'
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

### Step 1.3: Row-Level Security (RLS)

Enable RLS on all tenant-scoped tables:

```sql
-- Example for products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Step 1.4: Seed Data

Insert default modules and plans:

```sql
-- Insert modules
INSERT INTO modules (name, display_name, description) VALUES
  ('inventory', 'Inventory Management', 'Product and stock management'),
  ('hotel', 'Hotel & Table Management', 'Reservation and table tracking'),
  ('expenses', 'Expense Tracking', 'Business expense management'),
  ('landing', 'Landing Page', 'Public-facing portfolio'),
  ('ecommerce', 'E-commerce', 'Online store with products, cart, orders');

-- Insert plans
INSERT INTO plans (name, price, billing_cycle, features) VALUES
  ('basic', 9.99, 'monthly', '{"max_products": 100, "max_users": 2, "max_tables": 10}'),
  ('pro', 29.99, 'monthly', '{"max_products": 1000, "max_users": 10, "max_tables": 50}'),
  ('enterprise', 99.99, 'monthly', '{"max_products": -1, "max_users": -1, "max_tables": -1}');
```

### ✅ Deliverables
- Complete schema SQL file
- Prisma schema definition
- Migration scripts
- Seed data script

---

## 🔧 Phase 2: Backend API Development

**Duration**: 3-5 days  
**Goal**: Build core authentication and tenant management APIs

### Step 2.1: Project Setup

```bash
mkdir saas-backend
cd saas-backend
npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken dotenv zod
npm install -D typescript @types/node @types/express ts-node nodemon prisma
```

**Project Structure**:
```
src/
├── config/
│   └── database.ts
├── middleware/
│   ├── auth.ts
│   ├── tenantContext.ts
│   └── errorHandler.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── tenants/
│   │   ├── tenant.controller.ts
│   │   ├── tenant.service.ts
│   │   └── tenant.routes.ts
│   ├── users/
│   ├── inventory/
│   ├── hotel/
│   ├── expenses/
│   └── landing/
├── utils/
│   ├── jwt.ts
│   └── validators.ts
└── app.ts
```

### Step 2.2: Authentication APIs

#### Endpoints to Build

**POST /api/auth/register**
```json
Request:
{
  "tenantName": "ABC Store",
  "slug": "abc-store",
  "businessType": "inventory",
  "email": "owner@abc.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": "...", "email": "...", "role": "owner" },
  "tenant": { "id": "...", "name": "ABC Store" }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "owner@abc.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": {...},
  "tenant": {...}
}
```

**GET /api/auth/me** (Protected)
```json
Response:
{
  "user": {...},
  "tenant": {...},
  "permissions": ["inventory.create", "inventory.view"]
}
```

### Step 2.3: Tenant Management APIs

**GET /api/tenants** (Admin only)
**GET /api/tenants/:id**
**PUT /api/tenants/:id**
```json
Request:
{
  "name": "Updated Store Name",
  "status": "active"
}
```

**DELETE /api/tenants/:id** (Soft delete)

### Step 2.4: User Management APIs

**POST /api/users** (Create staff user)
```json
Request:
{
  "email": "staff@abc.com",
  "password": "pass123",
  "role": "staff"
}
```

**GET /api/users** (List tenant users)
**PUT /api/users/:id**
**DELETE /api/users/:id**

### Step 2.5: Module & Permission APIs

**GET /api/modules** (List all modules)
**GET /api/tenants/:id/modules** (Get enabled modules for tenant)
**PUT /api/tenants/:id/modules/:moduleId** (Enable/disable module)
```json
Request:
{
  "isEnabled": true,
  "config": { "maxTables": 20 }
}
```

**GET /api/permissions** (List all permissions)
**GET /api/users/:id/permissions** (Get user permissions)

### ✅ Deliverables
- Working Express.js backend
- JWT-based authentication
- Tenant context middleware
- Postman collection for core APIs
- Basic error handling

---

## 🧩 Phase 3: Module-Specific Backend APIs

**Duration**: 4-6 days  
**Goal**: Build CRUD APIs for each business module

### Step 3.1: Inventory Module APIs

**Products**
- `POST /api/inventory/products` - Create product
- `GET /api/inventory/products` - List products (with pagination, filters)
- `GET /api/inventory/products/:id` - Get product details
- `PUT /api/inventory/products/:id` - Update product
- `DELETE /api/inventory/products/:id` - Delete product

**Stock Management**
- `POST /api/inventory/products/:id/stock` - Adjust stock
- `GET /api/inventory/products/:id/movements` - Stock history
- `GET /api/inventory/low-stock` - Get low-stock products

### Step 3.2: Hotel Module APIs

**Tables**
- `POST /api/hotel/tables` - Create table
- `GET /api/hotel/tables` - List tables (filter by status, floor)
- `PUT /api/hotel/tables/:id/status` - Update table status

**Reservations**
- `POST /api/hotel/reservations` - Create reservation
- `GET /api/hotel/reservations` - List reservations (filter by date, status)
- `PUT /api/hotel/reservations/:id` - Update reservation
- `DELETE /api/hotel/reservations/:id` - Cancel reservation

### Step 3.3: Expense Module APIs

- `POST /api/expenses` - Create expense
- `GET /api/expenses` - List expenses (filter by date range, category)
- `GET /api/expenses/summary` - Get expense summary
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Step 3.4: Landing Page Module APIs

- `GET /api/landing-page` - Get published landing page
- `PUT /api/landing-page` - Update landing page content
- `POST /api/landing-page/assets` - Upload image/video
- `PUT /api/landing-page/publish` - Publish page

### Step 3.5: E-commerce Module APIs

**Categories**
- `POST /api/ecommerce/categories` - Create category
- `GET /api/ecommerce/categories` - List categories (with tree structure)
- `GET /api/ecommerce/categories/:id` - Get category details
- `PUT /api/ecommerce/categories/:id` - Update category
- `DELETE /api/ecommerce/categories/:id` - Delete category

**Products**
- `POST /api/ecommerce/products` - Create product
- `GET /api/ecommerce/products` - List products (with pagination, filters by category, price, stock)
- `GET /api/ecommerce/products/:id` - Get product details with variants & images
- `PUT /api/ecommerce/products/:id` - Update product
- `DELETE /api/ecommerce/products/:id` - Delete product
- `POST /api/ecommerce/products/:id/images` - Upload product images
- `DELETE /api/ecommerce/products/:id/images/:imageId` - Remove image

**Product Variants**
- `POST /api/ecommerce/products/:id/variants` - Create variant
- `PUT /api/ecommerce/products/:id/variants/:variantId` - Update variant
- `DELETE /api/ecommerce/products/:id/variants/:variantId` - Delete variant

**Shopping Cart** (Customer-facing)
- `GET /api/ecommerce/cart` - Get current cart
- `POST /api/ecommerce/cart/items` - Add item to cart
- `PUT /api/ecommerce/cart/items/:itemId` - Update item quantity
- `DELETE /api/ecommerce/cart/items/:itemId` - Remove item from cart
- `DELETE /api/ecommerce/cart` - Clear cart

**Checkout & Orders**
- `POST /api/ecommerce/checkout` - Create order from cart
- `GET /api/ecommerce/orders` - List orders (customer: own orders, admin: all orders)
- `GET /api/ecommerce/orders/:id` - Get order details
- `PUT /api/ecommerce/orders/:id/status` - Update order status (admin only)
- `POST /api/ecommerce/orders/:id/cancel` - Cancel order

**Coupons** (Admin)
- `POST /api/ecommerce/coupons` - Create coupon
- `GET /api/ecommerce/coupons` - List coupons
- `PUT /api/ecommerce/coupons/:id` - Update coupon
- `DELETE /api/ecommerce/coupons/:id` - Delete coupon
- `POST /api/ecommerce/coupons/validate` - Validate coupon code (customer)

**Analytics**
- `GET /api/ecommerce/analytics/sales` - Sales summary (revenue, orders count)
- `GET /api/ecommerce/analytics/top-products` - Best selling products
- `GET /api/ecommerce/analytics/low-stock` - Products with low stock

### ✅ Deliverables
- Complete Postman collections for each module
- Tested CRUD operations
- Validation and error handling
- Permission checks on all routes

---

## 👨‍💼 Phase 4: Admin Panel Backend

**Duration**: 2-3 days  
**Goal**: APIs for super-admin to manage the entire platform

### Step 4.1: Admin Tenant Management

**POST /api/admin/tenants** - Onboard new tenant
```json
Request:
{
  "name": "New Client",
  "slug": "new-client",
  "businessType": "hotel",
  "planId": "pro-plan-uuid",
  "ownerEmail": "owner@client.com",
  "ownerPassword": "temp123"
}
```

**GET /api/admin/tenants** - List all tenants with filters
**PUT /api/admin/tenants/:id/plan** - Change tenant plan
**PUT /api/admin/tenants/:id/status** - Suspend/activate tenant

### Step 4.2: Feature Flag APIs

**PUT /api/admin/tenants/:id/features** - Override features
```json
Request:
{
  "customLimits": {
    "maxProducts": 500,
    "maxUsers": 15
  }
}
```

### Step 4.3: Analytics APIs

**GET /api/admin/analytics/overview** - Platform statistics
```json
Response:
{
  "totalTenants": 150,
  "activeTenants": 142,
  "totalRevenue": 12500,
  "tenantsByPlan": {
    "basic": 80,
    "pro": 60,
    "enterprise": 10
  }
}
```

**GET /api/admin/analytics/tenants/:id** - Tenant-specific usage
```json
Response:
{
  "productCount": 45,
  "userCount": 3,
  "storageUsed": "2.5MB",
  "apiCallsThisMonth": 1250
}
```

### Step 4.4: Billing Integration (Placeholder)

**POST /api/admin/billing/subscribe** - Create subscription (Stripe)
**POST /api/admin/billing/webhooks** - Handle payment webhooks

### ✅ Deliverables
- Admin-only API routes
- Role-based access control enforcement
- Analytics endpoints
- Postman collection for admin

---

## 🎨 Phase 5: Frontend - Admin Panel

**Duration**: 5-7 days  
**Goal**: Build the admin dashboard UI

### Step 5.1: Next.js Project Setup

```bash
npx create-next-app@latest saas-admin --typescript --tailwind --app
cd saas-admin
npm install @tanstack/react-query axios zustand lucide-react
```

### Step 5.2: Design System

Create reusable components:
- `Button` (variants: primary, secondary, danger)
- `Input`, `Select`, `Textarea`
- `Card`, `Table`, `Modal`
- `Sidebar`, `Header`

### Step 5.3: Admin Pages

**Dashboard** (`/admin/dashboard`)
- Platform statistics cards
- Revenue charts
- Recent activity

**Tenant Management** (`/admin/tenants`)
- Data table with search, filters
- Actions: View, Edit, Suspend, Delete

**Tenant Details** (`/admin/tenants/[id]`)
- Tenant info
- Module toggles
- Plan management
- Custom limits override

**Plans** (`/admin/plans`)
- CRUD for plans
- Feature matrix

### ✅ Deliverables
- Functional admin panel
- Responsive design
- Data fetching with React Query
- Protected routes

---

## 🖥️ Phase 6: Frontend - Client Application

**Duration**: 7-10 days  
**Goal**: Build tenant-facing application with module-based UI

### Step 6.1: Project Setup

```bash
npx create-next-app@latest saas-client --typescript --tailwind --app
```

### Step 6.2: Dynamic Routing

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (client)/
│   └── [tenant-slug]/
│       ├── dashboard/
│       ├── inventory/
│       │   ├── products/
│       │   └── stock/
│       ├── hotel/
│       │   ├── tables/
│       │   └── reservations/
│       ├── expenses/
│       ├── ecommerce/
│       │   ├── products/
│       │   ├── categories/
│       │   ├── orders/
│       │   ├── coupons/
│       │   └── analytics/
│       ├── shop/              # Customer-facing storefront
│       │   ├── page.tsx       # Product catalog
│       │   ├── [productSlug]/ # Product detail
│       │   ├── cart/
│       │   └── checkout/
│       └── settings/
```

### Step 6.3: Module UIs

#### Inventory Module
- **Products List**: Data table with search, filters, pagination
- **Add/Edit Product**: Form with validation
- **Stock Management**: Adjust stock, view history
- **Low Stock Alerts**: Dashboard widget

#### Hotel Module
- **Table Grid View**: Visual floor plan
- **Reservations Calendar**: Date picker, timeline view
- **Create Reservation**: Form with table selection

#### Expense Module
- **Expense List**: Sortable table
- **Add Expense**: Quick-add form
- **Analytics**: Charts (monthly/yearly breakdown)

#### Landing Page Module
- **Page Builder**: Drag-drop or simple form
- **Asset Manager**: Image upload
- **Preview & Publish**: See live page

#### E-commerce Module
- **Product Catalog**: Grid/list view with category sidebar, search, filters (price, availability)
- **Product Detail Page**: Images gallery, variants selector, add to cart
- **Categories Management**: Tree view, drag-drop ordering
- **Shopping Cart**: Item list, quantity controls, coupon input, order summary
- **Checkout Flow**: Multi-step (Shipping → Payment → Confirmation)
- **Order History**: Customer order list with status tracking
- **Order Management (Admin)**: 
  - Orders table with filters (status, date, customer)
  - Order detail view with status updates (processing → shipped → delivered)
  - Print invoice/packing slip
- **Coupons Management (Admin)**: Create/edit coupons, usage stats
- **E-commerce Dashboard**: Sales charts, recent orders, top products, low stock alerts

### Step 6.4: Tenant Context & Permissions

```tsx
// hooks/useTenantContext.ts
export function useTenantContext() {
  const { data } = useQuery('/api/auth/me');
  return {
    tenant: data?.tenant,
    modules: data?.enabledModules,
    permissions: data?.permissions
  };
}

// hooks/usePermission.ts
export function usePermission(permission: string) {
  const { permissions } = useTenantContext();
  return permissions?.includes(permission);
}
```

### ✅ Deliverables
- Fully functional client app
- Module-based navigation
- Permission-gated features
- Responsive design

---

## 🧪 Phase 7: Integration & Testing

**Duration**: 3-4 days  
**Goal**: Test everything end-to-end

### Step 7.1: End-to-End Testing
- Create test scenarios for each module
- Test multi-tenant isolation
- Test permission system

### Step 7.2: Performance Optimization
- Database query optimization
- Add caching (Redis if needed)
- Frontend lazy loading

### Step 7.3: Security Audit
- SQL injection prevention (Prisma handles this)
- XSS protection
- CSRF tokens
- Rate limiting on APIs

### Step 7.4: Documentation
- API documentation (Swagger/Postman)
- User guides
- Deployment guide

### ✅ Deliverables
- Tested application
- Performance benchmarks
- Security checklist
- Complete documentation

---

## 📅 Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Database | 1-2 days | 2 days |
| Phase 2: Core Backend | 3-5 days | 7 days |
| Phase 3: Module APIs | 4-6 days | 13 days |
| Phase 4: Admin APIs | 2-3 days | 16 days |
| **Backend Complete** | | **~3 weeks** |
| Phase 5: Admin UI | 5-7 days | 23 days |
| Phase 6: Client UI | 7-10 days | 33 days |
| Phase 7: Testing | 3-4 days | 37 days |
| **Total** | | **~6-8 weeks** |

---

## 🎯 Next Immediate Steps

1. **Set up development environment**
   - Install PostgreSQL
   - Install Node.js v18+
   - Install Postman

2. **Initialize project**
   - Create backend directory
   - Initialize npm and install dependencies
   - Set up Prisma

3. **Create database schema**
   - Write Prisma schema file
   - Generate and run migrations
   - Add seed data

**Once Phase 1 is complete, we'll move to Phase 2 and start building APIs!**
