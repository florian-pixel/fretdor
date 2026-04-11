import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check current settings
  let settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
  console.log('Current settings:', settings);

  if (!settings) {
    // Create default settings with commission enabled
    settings = await prisma.platformSettings.create({
      data: {
        id: 'default',
        commissionRate: 5.0,
        commissionEnabled: true,
        minimumCommission: 1000,
        maximumCommission: null,
      }
    });
    console.log('✅ Created settings with 5% commission');
  } else if (!settings.commissionEnabled) {
    // Enable commission
    settings = await prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        commissionRate: 5.0,
        commissionEnabled: true,
        minimumCommission: 1000,
      }
    });
    console.log('✅ Enabled 5% commission');
  } else {
    console.log('✅ Commission already enabled');
  }
  console.log('Final settings:', settings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
