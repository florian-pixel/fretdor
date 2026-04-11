import { prisma } from './prisma';

export type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'NEGOTIATION'
  | 'BOOKING_COMPLETED'
  | 'REVIEW_RECEIVED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'SYSTEM';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Fonctions helper pour créer des notifications spécifiques
export const notifications = {
  // Nouvelle demande de réservation (pour le fréteur)
  bookingRequest: async (freteurId: string, vehicleName: string, affreteurName: string, bookingId: string) => {
    return createNotification({
      userId: freteurId,
      type: 'BOOKING_REQUEST',
      title: 'Nouvelle demande de réservation',
      message: `${affreteurName} souhaite réserver votre ${vehicleName}`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Réservation acceptée (pour l'affréteur)
  bookingAccepted: async (affreteurId: string, vehicleName: string, freteurName: string, bookingId: string) => {
    return createNotification({
      userId: affreteurId,
      type: 'BOOKING_ACCEPTED',
      title: 'Réservation acceptée !',
      message: `${freteurName} a accepté votre réservation pour ${vehicleName}`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Réservation refusée (pour l'affréteur)
  bookingRejected: async (affreteurId: string, vehicleName: string, freteurName: string, bookingId: string) => {
    return createNotification({
      userId: affreteurId,
      type: 'BOOKING_REJECTED',
      title: 'Réservation refusée',
      message: `${freteurName} a refusé votre réservation pour ${vehicleName}`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Réservation annulée
  bookingCancelled: async (userId: string, vehicleName: string, cancelledBy: string, bookingId: string) => {
    return createNotification({
      userId,
      type: 'BOOKING_CANCELLED',
      title: 'Réservation annulée',
      message: `La réservation pour ${vehicleName} a été annulée par ${cancelledBy}`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Nouvelle proposition de prix (négociation)
  negotiationProposal: async (userId: string, vehicleName: string, proposerName: string, price: number, bookingId: string) => {
    return createNotification({
      userId,
      type: 'NEGOTIATION',
      title: 'Nouvelle proposition de prix',
      message: `${proposerName} propose ${price.toLocaleString()} FCFA pour ${vehicleName}`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Réservation terminée (pour les deux parties)
  bookingCompleted: async (userId: string, vehicleName: string, bookingId: string) => {
    return createNotification({
      userId,
      type: 'BOOKING_COMPLETED',
      title: 'Réservation terminée',
      message: `La réservation pour ${vehicleName} est terminée. N'oubliez pas de laisser un avis !`,
      link: `/dashboard?booking=${bookingId}`,
    });
  },

  // Nouvel avis reçu
  reviewReceived: async (userId: string, reviewerName: string, rating: number) => {
    return createNotification({
      userId,
      type: 'REVIEW_RECEIVED',
      title: 'Nouvel avis reçu',
      message: `${reviewerName} vous a donné ${rating} étoile${rating > 1 ? 's' : ''}`,
      link: '/profile?tab=reviews',
    });
  },

  // Notification système
  system: async (userId: string, title: string, message: string, link?: string) => {
    return createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      link,
    });
  },
};
