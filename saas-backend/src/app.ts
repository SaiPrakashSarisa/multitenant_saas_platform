import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import userRoutes from './modules/users/user.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import hotelRoutes from './modules/hotel/hotel.routes';
import expenseRoutes from './modules/expenses/expense.routes';
import adminAuthRoutes from './modules/admin/auth/admin.auth.routes';
import adminTenantRoutes from './modules/admin/tenants/admin.tenant.routes';
import adminAnalyticsRoutes from './modules/admin/analytics/admin.analytics.routes';
import adminSystemRoutes from './modules/admin/system/admin.system.routes';
import adminPlanRoutes from './modules/admin/plans/admin.plans.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // Admin Frontend
    'http://localhost:3001', // Potential Tenant Frontend port
    process.env.CORS_ORIGIN || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'SaaS Backend API is running',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// API Routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Multi-Tenant SaaS API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tenants: '/api/tenants',
      users: '/api/users',
      inventory: '/api/inventory',
      hotel: '/api/hotel',
      expenses: '/api/expenses',
      adminAuth: '/api/admin/auth',
      health: '/health',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/tenants', adminTenantRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/system', adminSystemRoutes);
app.use('/api/admin/plans', adminPlanRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
});

export default app;
