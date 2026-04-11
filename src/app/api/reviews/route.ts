import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notifications } from '@/lib/notifications';

// Get reviews for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const received = searchParams.get('received');

  // If received=true, get reviews for current user
  if (received === 'true') {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const reviews = await prisma.review.findMany({
        where: { revieweeId: session.user.id },
        include: {
          reviewer: { select: { name: true, role: true, entityType: true } },
          booking: {
            include: {
              vehicle: { select: { brand: true, model: true, type: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return NextResponse.json({
        reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Error fetching reviews' }, { status: 500 });
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { name: true, role: true, entityType: true } },
        booking: {
          include: {
            vehicle: { select: { brand: true, model: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Error fetching reviews' }, { status: 500 });
  }
}

// Create a new review
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId, rating, comment } = await request.json();

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: { select: { ownerId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Booking must be completed to leave a review' }, { status: 400 });
    }

    // Determine who is being reviewed
    let revieweeId: string;
    if (session.user.id === booking.affreteurId) {
      // Affreteur reviewing the Freteur
      revieweeId = booking.vehicle.ownerId;
    } else if (session.user.id === booking.vehicle.ownerId) {
      // Freteur reviewing the Affreteur
      revieweeId = booking.affreteurId;
    } else {
      return NextResponse.json({ error: 'You are not part of this booking' }, { status: 403 });
    }

    // Check if user already left a review for this booking
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        reviewerId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: session.user.id,
        revieweeId,
        rating,
        comment,
      },
    });

    // Notifier l'utilisateur qu'il a reçu un avis
    await notifications.reviewReceived(revieweeId, session.user.name, rating);

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error creating review' }, { status: 500 });
  }
}
