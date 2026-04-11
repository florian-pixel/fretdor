import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get platform settings
  const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });

  if (!settings || !settings.commissionEnabled) {
    console.log('❌ Commission not enabled in settings');
    return;
  }

  console.log(`Commission rate: ${settings.commissionRate}%`);

  // Find CONFIRMED or PAID bookings without commission calculated
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] },
      OR: [
        { commissionRate: null },
        { commissionRate: 0 },
        { netAmount: null }
      ]
    }
  });

  console.log(`Found ${bookings.length} bookings to update`);

  for (const booking of bookings) {
    const finalPrice = booking.agreedPrice || booking.initialPrice;

    // Calculate commission
    let commissionAmount = (finalPrice * settings.commissionRate) / 100;

    // Apply minimum commission
    if (settings.minimumCommission > 0) {
      commissionAmount = Math.max(commissionAmount, settings.minimumCommission);
    }

    // Apply maximum commission
    if (settings.maximumCommission !== null) {
      commissionAmount = Math.min(commissionAmount, settings.maximumCommission);
    }

    const netAmount = finalPrice - commissionAmount;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        commissionRate: settings.commissionRate,
        commissionAmount: commissionAmount,
        netAmount: netAmount,
      }
    });

    console.log(`✅ Updated booking ${booking.id}: ${finalPrice} FCFA → Net: ${netAmount} FCFA (Commission: ${commissionAmount} FCFA)`);
  }

  console.log('\n✅ All bookings updated!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
