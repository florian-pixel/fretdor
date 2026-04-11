import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone, entityType, rccm, cin, rccmDocUrl, cinDocUrl } = body;

    if (!email || !password || !name || !role || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate entity specific fields
    if (entityType === 'COMPANY' && !rccm) {
      return NextResponse.json({ error: 'RCCM is required for companies' }, { status: 400 });
    }
    if (entityType === 'INDIVIDUAL' && !cin) {
      return NextResponse.json({ error: 'CIN is required for individuals' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone,
        entityType,
        rccm,
        cin,
        rccmDocUrl,
        cinDocUrl,
        isVerified: false,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    await login(userWithoutPassword);

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
