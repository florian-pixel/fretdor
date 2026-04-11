import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true, phone: true } },
        images: true,
        externalBookings: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching vehicle' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      imageUrl, images,
      isAvailable,
    } = body;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(firstRegistrationDate !== undefined && { firstRegistrationDate: firstRegistrationDate ? new Date(firstRegistrationDate) : null }),
        ...(trailerRegistrationNumber !== undefined && { trailerRegistrationNumber }),
        ...(color !== undefined && { color }),
        ...(capacityWeight !== undefined && { capacityWeight: capacityWeight ? parseFloat(capacityWeight) : null }),
        ...(capacityVolume !== undefined && { capacityVolume: capacityVolume ? parseFloat(capacityVolume) : null }),
        ...(isOffRoadCapable !== undefined && { isOffRoadCapable: Boolean(isOffRoadCapable) }),
        ...(hasDriver !== undefined && { hasDriver: Boolean(hasDriver) }),
        ...(hasConvoyeur !== undefined && { hasConvoyeur: Boolean(hasConvoyeur) }),
        ...(fuelType !== undefined && { fuelType }),
        ...(transmission !== undefined && { transmission }),
        ...(location !== undefined && { location }),
        ...(pricingType !== undefined && { pricingType }),
        ...(pricePerDay !== undefined && { pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null }),
        ...(pricePerKm !== undefined && { pricePerKm: pricePerKm ? parseFloat(pricePerKm) : null }),
        ...(pricePerTonneKm !== undefined && { pricePerTonneKm: pricePerTonneKm ? parseFloat(pricePerTonneKm) : null }),
        ...(minPrice !== undefined && { minPrice: minPrice ? parseFloat(minPrice) : null }),
        ...(maxPrice !== undefined && { maxPrice: maxPrice ? parseFloat(maxPrice) : null }),
        ...(conditions !== undefined && { conditions }),
        ...(assuranceDocUrl !== undefined && { assuranceDocUrl }),
        ...(visiteTechniqueDocUrl !== undefined && { visiteTechniqueDocUrl }),
        ...(carteGriseDocUrl !== undefined && { carteGriseDocUrl }),
        ...(patenteDocUrl !== undefined && { patenteDocUrl }),
        ...(photoFrontUrl !== undefined && { photoFrontUrl }),
        ...(photoRearUrl !== undefined && { photoRearUrl }),
        ...(photoLeftUrl !== undefined && { photoLeftUrl }),
        ...(photoRightUrl !== undefined && { photoRightUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((url: string) => ({ url })),
          }
        }),
      },
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating vehicle' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting vehicle' }, { status: 500 });
  }
}
