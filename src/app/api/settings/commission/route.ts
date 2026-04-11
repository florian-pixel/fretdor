import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer le taux de commission (public)
export async function GET() {
  try {
    const platformSettings = await prisma.platformSettings.findFirst();
    
    return NextResponse.json({
      commissionRate: platformSettings?.commissionRate || 5,
      commissionEnabled: platformSettings?.commissionEnabled ?? true,
    });
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    return NextResponse.json({ 
      commissionRate: 5,
      commissionEnabled: true,
    });
  }
}
