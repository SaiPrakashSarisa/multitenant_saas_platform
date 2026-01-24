import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'basic',
      displayName: 'Basic Plan',
      price: 29.00,
      billingCycle: 'monthly',
      features: { maxUsers: 5, maxProducts: 100, support: 'email' }
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      price: 79.00,
      billingCycle: 'monthly',
      features: { maxUsers: 20, maxProducts: 1000, support: 'priority' }
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      price: 199.00,
      billingCycle: 'monthly',
      features: { maxUsers: 100, maxProducts: 10000, support: '24/7' }
    },
    {
      name: 'basic-yearly',
      displayName: 'Basic Plan (Yearly)',
      price: 290.00,
      billingCycle: 'yearly',
      features: { maxUsers: 5, maxProducts: 100, support: 'email' }
    }
  ];

  console.log('Seeding plans...');

  for (const plan of plans) {
    const exists = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!exists) {
      await prisma.plan.create({ data: plan });
      console.log(`Created plan: ${plan.displayName}`);
    } else {
      console.log(`Plan already exists: ${plan.displayName}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
