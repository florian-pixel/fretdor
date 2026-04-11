import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check bookings with commission data
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      status: true,
      initialPrice: true,
      agreedPrice: true,
      commissionRate: true,
      commissionAmount: true,
      netAmount: true,
      paymentStatus: true,
      vehicle: {
        select: { brand: true, model: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Recent bookings with commission data:');
  bookings.forEach((b, i) => {
    console.log(`\n${i + 1}. ${b.vehicle.brand} ${b.vehicle.model}`);
    console.log(`   Status: ${b.status}, Payment: ${b.paymentStatus || 'N/A'}`);
    console.log(`   Initial: ${b.initialPrice} FCFA, Agreed: ${b.agreedPrice || 'N/A'} FCFA`);
    console.log(`   Commission: ${b.commissionRate || 0}%, Amount: ${b.commissionAmount || 0} FCFA`);
    console.log(`   Net Amount: ${b.netAmount || 'N/A'} FCFA`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
