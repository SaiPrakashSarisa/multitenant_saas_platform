import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Plans
  console.log('Creating plans...');
  
  // Free Trial Plan - 2 months free
  const trialPlan = await prisma.plan.upsert({
    where: { name: 'trial' },
    update: {},
    create: {
      name: 'trial',
      displayName: 'Free Trial (2 Months)',
      price: 0.00,
      billingCycle: 'trial',
      features: {
        maxProducts: 50,
        maxUsers: 2,
        maxTables: 5,
        maxStorageMB: 50,
        trialDurationDays: 60, // 2 months
      },
    },
  });

  const basicPlan = await prisma.plan.upsert({
    where: { name: 'basic' },
    update: {},
    create: {
      name: 'basic',
      displayName: 'Basic Plan',
      price: 9.99,
      billingCycle: 'monthly',
      features: {
        maxProducts: 100,
        maxUsers: 2,
        maxTables: 10,
        maxStorageMB: 100,
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro Plan',
      price: 29.99,
      billingCycle: 'monthly',
      features: {
        maxProducts: 1000,
        maxUsers: 10,
        maxTables: 50,
        maxStorageMB: 1000,
      },
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      price: 99.99,
      billingCycle: 'monthly',
      features: {
        maxProducts: -1, // Unlimited
        maxUsers: -1,
        maxTables: -1,
        maxStorageMB: -1,
      },
    },
  });

  console.log(`✅ Created plans: ${trialPlan.displayName}, ${basicPlan.displayName}, ${proPlan.displayName}, ${enterprisePlan.displayName}`);

  // Create Modules
  console.log('Creating modules...');
  const inventoryModule = await prisma.module.upsert({
    where: { name: 'inventory' },
    update: {},
    create: {
      name: 'inventory',
      displayName: 'Inventory Management',
      description: 'Manage products, stock levels, and track inventory movements',
    },
  });

  const hotelModule = await prisma.module.upsert({
    where: { name: 'hotel' },
    update: {},
    create: {
      name: 'hotel',
      displayName: 'Hotel & Table Management',
      description: 'Manage table reservations and track occupancy',
    },
  });

  const expensesModule = await prisma.module.upsert({
    where: { name: 'expenses' },
    update: {},
    create: {
      name: 'expenses',
      displayName: 'Expense Tracking',
      description: 'Track and categorize business expenses',
    },
  });

  const landingModule = await prisma.module.upsert({
    where: { name: 'landing' },
    update: {},
    create: {
      name: 'landing',
      displayName: 'Landing Page Builder',
      description: 'Create and manage public-facing landing pages',
    },
  });

  console.log(`✅ Created modules: Inventory, Hotel, Expenses, Landing Page`);

  // Create Permissions
  console.log('Creating permissions...');
  const permissions = [
    // Inventory permissions
    { name: 'inventory.view', moduleId: inventoryModule.id, description: 'View inventory products', minPlanLevel: 'basic' },
    { name: 'inventory.create', moduleId: inventoryModule.id, description: 'Create new products', minPlanLevel: 'basic' },
    { name: 'inventory.edit', moduleId: inventoryModule.id, description: 'Edit existing products', minPlanLevel: 'basic' },
    { name: 'inventory.delete', moduleId: inventoryModule.id, description: 'Delete products', minPlanLevel: 'pro' },
    { name: 'inventory.stock', moduleId: inventoryModule.id, description: 'Manage stock movements', minPlanLevel: 'basic' },
    
    // Hotel permissions
    { name: 'hotel.view', moduleId: hotelModule.id, description: 'View tables and reservations', minPlanLevel: 'basic' },
    { name: 'hotel.manage_tables', moduleId: hotelModule.id, description: 'Manage table settings', minPlanLevel: 'basic' },
    { name: 'hotel.manage_reservations', moduleId: hotelModule.id, description: 'Create and manage reservations', minPlanLevel: 'basic' },
    
    // Expenses permissions
    { name: 'expenses.view', moduleId: expensesModule.id, description: 'View expense records', minPlanLevel: 'basic' },
    { name: 'expenses.create', moduleId: expensesModule.id, description: 'Create new expenses', minPlanLevel: 'basic' },
    { name: 'expenses.edit', moduleId: expensesModule.id, description: 'Edit expense records', minPlanLevel: 'basic' },
    { name: 'expenses.delete', moduleId: expensesModule.id, description: 'Delete expenses', minPlanLevel: 'pro' },
    
    // Landing Page permissions
    { name: 'landing.view', moduleId: landingModule.id, description: 'View landing page', minPlanLevel: 'basic' },
    { name: 'landing.edit', moduleId: landingModule.id, description: 'Edit landing page content', minPlanLevel: 'basic' },
    { name: 'landing.publish', moduleId: landingModule.id, description: 'Publish landing page', minPlanLevel: 'basic' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
