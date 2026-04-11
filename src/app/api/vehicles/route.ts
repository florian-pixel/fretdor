import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const location = searchParams.get('location');
  const isOffRoadCapable = searchParams.get('isOffRoadCapable');
  const ownerId = searchParams.get('ownerId');

  const where: any = {
    isAvailable: true,
  };

  if (type) where.type = type;
  if (location) where.location = { contains: location };
  if (isOffRoadCapable === 'true') where.isOffRoadCapable = true;
  if (ownerId) {
    where.ownerId = ownerId;
    delete where.isAvailable; // Owner can see all their vehicles
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, phone: true } },
      },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching vehicles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'FRETEUR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      type, brand, model, registrationNumber,
      firstRegistrationDate, trailerRegistrationNumber, color,
      capacityWeight, capacityVolume,
      isOffRoadCapable, hasDriver, hasConvoyeur, fuelType, transmission,
      location,
      pricingType, pricePerDay, pricePerKm, pricePerTonneKm,
      minPrice, maxPrice,
      conditions,
      assuranceDocUrl, visiteTechniqueDocUrl, carteGriseDocUrl, patenteDocUrl,
      photoFrontUrl, photoRearUrl, photoLeftUrl, photoRightUrl,
      images
    } = body;

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: session.user.id,
        type,
        brand,
        model,
        registrationNumber,
        firstRegistrationDate: firstRegistrationDate ? new Date(firstRegistrationDate) : null,
        trailerRegistrationNumber: trailerRegistrationNumber || null,
        color: color || null,
        capacityWeight: capacityWeight ? parseFloat(capacityWeight) : null,
        capacityVolume: capacityVolume ? parseFloat(capacityVolume) : null,
        isOffRoadCapable: Boolean(isOffRoadCapable),
        hasDriver: Boolean(hasDriver),
        hasConvoyeur: Boolean(hasConvoyeur),
        fuelType,
        transmission,
        location,
        pricingType,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        pricePerKm: pricePerKm ? parseFloat(pricePerKm) : null,
        pricePerTonneKm: pricePerTonneKm ? parseFloat(pricePerTonneKm) : null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        conditions,
        assuranceDocUrl: assuranceDocUrl || null,
        visiteTechniqueDocUrl: visiteTechniqueDocUrl || null,
        carteGriseDocUrl: carteGriseDocUrl || null,
        patenteDocUrl: patenteDocUrl || null,
        photoFrontUrl: photoFrontUrl || null,
        photoRearUrl: photoRearUrl || null,
        photoLeftUrl: photoLeftUrl || null,
        photoRightUrl: photoRightUrl || null,
        imageUrl: images && images.length > 0 ? images[0] : null,
        images: {
          create: images ? images.map((url: string) => ({ url })) : [],
        }
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Error creating vehicle' }, { status: 500 });
  }
}
