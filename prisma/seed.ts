import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Suppression des données existantes...');

  // Delete in correct order (relations first)
  await prisma.review.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Base de données vidée');

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('👤 Création des utilisateurs...');

  // ========== ADMIN ==========
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fretdor.ci',
      password: passwordHash,
      name: 'Administrateur FRETDOR',
      role: 'ADMIN',
      entityType: 'COMPANY',
      rccm: 'CI-ABJ-01-2020-B12-00145',
      phone: '+225 07 00 00 00 00',
      address: 'Tour FRETDOR, Boulevard de la République, Abidjan',
      isVerified: true,
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // ========== FRETEURS ==========
  const freteur1 = await prisma.user.create({
    data: {
      email: 'transport.mbemba@gmail.com',
      password: passwordHash,
      name: 'Transport Mbemba & Fils',
      role: 'FRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-BZV-01-2019-B12-00234',
      phone: '+242 06 612 34 56',
      address: '45 Avenue de la Paix, Bacongo, Brazzaville',
      isVerified: true,
    },
  });

  const freteur2 = await prisma.user.create({
    data: {
      email: 'logistique.congo@yahoo.fr',
      password: passwordHash,
      name: 'Congo Logistique SARL',
      role: 'FRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-PNR-01-2021-B12-00089',
      phone: '+242 05 789 12 34',
      address: 'Zone Industrielle de Mpila, Pointe-Noire',
      isVerified: true,
    },
  });

  const freteur3 = await prisma.user.create({
    data: {
      email: 'jean.mokoko@gmail.com',
      password: passwordHash,
      name: 'Jean-Pierre Mokoko',
      role: 'FRETEUR',
      entityType: 'INDIVIDUAL',
      cin: '1985-BZV-04521',
      phone: '+242 06 456 78 90',
      address: '12 Rue Matsiona, Ouenzé, Brazzaville',
      isVerified: true,
    },
  });

  const freteur4 = await prisma.user.create({
    data: {
      email: 'express.transport@gmail.com',
      password: passwordHash,
      name: 'Express Transport Congo',
      role: 'FRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-BZV-01-2022-B12-00567',
      phone: '+242 06 123 45 67',
      address: '78 Boulevard Denis Sassou Nguesso, Brazzaville',
      isVerified: true,
    },
  });

  console.log(`  ✓ Fréteurs: 4 créés`);

  // ========== AFFRETEURS ==========
  const affreteur1 = await prisma.user.create({
    data: {
      email: 'btp.makounda@gmail.com',
      password: passwordHash,
      name: 'BTP Makounda Construction',
      role: 'AFFRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-BZV-01-2018-B12-00321',
      phone: '+242 06 987 65 43',
      address: '23 Avenue des 3 Martyrs, Brazzaville',
      isVerified: true,
    },
  });

  const affreteur2 = await prisma.user.create({
    data: {
      email: 'agri.nsamba@yahoo.fr',
      password: passwordHash,
      name: 'Coopérative Agricole Nsamba',
      role: 'AFFRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-DOL-01-2020-B12-00078',
      phone: '+242 05 234 56 78',
      address: 'Route de Dolisie, Niari',
      isVerified: true,
    },
  });

  const affreteur3 = await prisma.user.create({
    data: {
      email: 'marie.bakala@gmail.com',
      password: passwordHash,
      name: 'Marie-Claire Bakala',
      role: 'AFFRETEUR',
      entityType: 'INDIVIDUAL',
      cin: '1990-PNR-08765',
      phone: '+242 06 321 09 87',
      address: '56 Rue Loango, Pointe-Noire',
      isVerified: true,
    },
  });

  const affreteur4 = await prisma.user.create({
    data: {
      email: 'import.export.congo@gmail.com',
      password: passwordHash,
      name: 'Congo Import Export SA',
      role: 'AFFRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-PNR-01-2019-B12-00456',
      phone: '+242 05 876 54 32',
      address: 'Port Autonome de Pointe-Noire',
      isVerified: true,
    },
  });

  const affreteur5 = await prisma.user.create({
    data: {
      email: 'supermarche.brazza@gmail.com',
      password: passwordHash,
      name: 'Supermarché Brazza Plus',
      role: 'AFFRETEUR',
      entityType: 'COMPANY',
      rccm: 'CG-BZV-01-2021-B12-00234',
      phone: '+242 06 765 43 21',
      address: '100 Avenue de France, Brazzaville',
      isVerified: false, // Non vérifié pour montrer le statut
    },
  });

  console.log(`  ✓ Affréteurs: 5 créés`);

  // ========== VEHICULES ==========
  console.log('🚛 Création des véhicules...');

  const vehicle1 = await prisma.vehicle.create({
    data: {
      ownerId: freteur1.id,
      type: 'Benne',
      brand: 'Mercedes-Benz',
      model: 'Actros 3340',
      registrationNumber: 'BZV-1234-AB',
      capacityWeight: 25,
      isOffRoadCapable: true,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Manuelle',
      location: 'Brazzaville',
      pricingType: 'PER_DAY',
      pricePerDay: 350000,
      conditions: 'Carburant non inclus. Chauffeur expérimenté inclus. Minimum 2 jours de location. Assurance tous risques incluse.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      ownerId: freteur1.id,
      type: 'Plateau',
      brand: 'Renault',
      model: 'T460',
      registrationNumber: 'BZV-5678-CD',
      capacityWeight: 20,
      capacityVolume: 60,
      isOffRoadCapable: false,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Automatique',
      location: 'Brazzaville',
      pricingType: 'PER_DAY',
      pricePerDay: 280000,
      conditions: 'Idéal pour transport de matériaux de construction. Sangles et bâches fournies. Chauffeur avec permis poids lourd.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1586191582056-09b76c289c69?w=800',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      ownerId: freteur2.id,
      type: 'Citerne',
      brand: 'Scania',
      model: 'R500',
      registrationNumber: 'PNR-9012-EF',
      capacityVolume: 30000,
      isOffRoadCapable: false,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Automatique',
      location: 'Pointe-Noire',
      pricingType: 'PER_KM',
      pricePerKm: 1500,
      conditions: 'Transport de carburant et huiles. Normes ADR respectées. Assurance spéciale matières dangereuses.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      ownerId: freteur2.id,
      type: 'Frigo',
      brand: 'Volvo',
      model: 'FH16',
      registrationNumber: 'PNR-3456-GH',
      capacityWeight: 15,
      capacityVolume: 45,
      isOffRoadCapable: false,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Automatique',
      location: 'Pointe-Noire',
      pricingType: 'PER_DAY',
      pricePerDay: 450000,
      conditions: 'Température réglable de -25°C à +25°C. Idéal pour produits alimentaires et pharmaceutiques. Groupe frigorifique autonome.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800',
    },
  });

  const vehicle5 = await prisma.vehicle.create({
    data: {
      ownerId: freteur3.id,
      type: 'Bâché',
      brand: 'Isuzu',
      model: 'NQR 500',
      registrationNumber: 'BZV-7890-IJ',
      capacityWeight: 8,
      capacityVolume: 35,
      isOffRoadCapable: true,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Manuelle',
      location: 'Brazzaville',
      pricingType: 'PER_DAY',
      pricePerDay: 150000,
      conditions: 'Parfait pour transport de marchandises diverses. Bâche imperméable. Peut accéder aux zones rurales.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800',
    },
  });

  const vehicle6 = await prisma.vehicle.create({
    data: {
      ownerId: freteur4.id,
      type: 'Benne',
      brand: 'MAN',
      model: 'TGS 33.400',
      registrationNumber: 'BZV-2468-KL',
      capacityWeight: 30,
      isOffRoadCapable: true,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Manuelle',
      location: 'Brazzaville',
      pricingType: 'PER_DAY',
      pricePerDay: 400000,
      conditions: 'Benne basculante arrière. Idéal pour chantiers BTP. Chauffeur avec 10 ans d\'expérience.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800',
    },
  });

  const vehicle7 = await prisma.vehicle.create({
    data: {
      ownerId: freteur4.id,
      type: 'Plateau',
      brand: 'DAF',
      model: 'XF 480',
      registrationNumber: 'BZV-1357-MN',
      capacityWeight: 25,
      capacityVolume: 80,
      isOffRoadCapable: false,
      hasDriver: true,
      fuelType: 'Diesel',
      transmission: 'Automatique',
      location: 'Dolisie',
      pricingType: 'PER_KM',
      pricePerKm: 1200,
      conditions: 'Transport longue distance. Suivi GPS en temps réel. Assurance tous risques marchandises.',
      isAvailable: false, // En cours d'utilisation
      imageUrl: 'https://images.unsplash.com/photo-1586191582056-09b76c289c69?w=800',
    },
  });

  console.log(`  ✓ Véhicules: 7 créés`);

  // Helper function to calculate number of days
  const calculateDays = (start: Date, end: Date): number => {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ========== RESERVATIONS ==========
  console.log('📅 Création des réservations...');

  // Réservation 1: COMPLETED avec avis
  const startDate1 = new Date('2024-11-15');
  const endDate1 = new Date('2024-11-20');
  const booking1 = await prisma.booking.create({
    data: {
      vehicleId: vehicle1.id,
      affreteurId: affreteur1.id,
      startDate: startDate1,
      endDate: endDate1,
      startLocation: 'Carrière de Mindouli',
      endLocation: 'Chantier Port de Brazzaville',
      status: 'COMPLETED',
      numberOfDays: calculateDays(startDate1, endDate1),
      pricePerDay: 350000,
      initialPrice: 1750000,
      agreedPrice: 1600000,
    },
  });

  await prisma.negotiation.createMany({
    data: [
      { bookingId: booking1.id, proposerId: affreteur1.id, price: 1400000, createdAt: new Date('2024-11-10T09:00:00') },
      { bookingId: booking1.id, proposerId: freteur1.id, price: 1700000, createdAt: new Date('2024-11-10T14:30:00') },
      { bookingId: booking1.id, proposerId: affreteur1.id, price: 1600000, createdAt: new Date('2024-11-11T08:00:00') },
    ],
  });

  // Réservation 2: COMPLETED avec avis
  const startDate2 = new Date('2024-11-25');
  const endDate2 = new Date('2024-11-28');
  const booking2 = await prisma.booking.create({
    data: {
      vehicleId: vehicle4.id,
      affreteurId: affreteur3.id,
      startDate: startDate2,
      endDate: endDate2,
      startLocation: 'Marché Total, Pointe-Noire',
      endLocation: 'Entrepôt Brazzaville Nord',
      status: 'COMPLETED',
      numberOfDays: calculateDays(startDate2, endDate2),
      pricePerDay: 450000,
      initialPrice: 1350000,
      agreedPrice: 1350000,
    },
  });

  await prisma.negotiation.create({
    data: { bookingId: booking2.id, proposerId: affreteur3.id, price: 1350000 },
  });

  // Réservation 3: CONFIRMED (en cours)
  const startDate3 = new Date('2024-12-20');
  const endDate3 = new Date('2024-12-27');
  const booking3 = await prisma.booking.create({
    data: {
      vehicleId: vehicle6.id,
      affreteurId: affreteur1.id,
      startDate: startDate3,
      endDate: endDate3,
      startLocation: 'Dépôt BTP Makounda, Brazzaville',
      endLocation: 'Chantier Autoroute Nationale 1',
      status: 'CONFIRMED',
      numberOfDays: calculateDays(startDate3, endDate3),
      pricePerDay: 400000,
      initialPrice: 2800000,
      agreedPrice: 2500000,
    },
  });

  await prisma.negotiation.createMany({
    data: [
      { bookingId: booking3.id, proposerId: affreteur1.id, price: 2200000, createdAt: new Date('2024-12-15T10:00:00') },
      { bookingId: booking3.id, proposerId: freteur4.id, price: 2600000, createdAt: new Date('2024-12-15T16:00:00') },
      { bookingId: booking3.id, proposerId: affreteur1.id, price: 2500000, createdAt: new Date('2024-12-16T09:00:00') },
    ],
  });

  // Réservation 4: PENDING
  const startDate4 = new Date('2024-12-28');
  const endDate4 = new Date('2024-12-30');
  const booking4 = await prisma.booking.create({
    data: {
      vehicleId: vehicle5.id,
      affreteurId: affreteur2.id,
      startDate: startDate4,
      endDate: endDate4,
      startLocation: 'Ferme Nsamba, Niari',
      endLocation: 'Marché de Gros, Brazzaville',
      status: 'PENDING',
      numberOfDays: calculateDays(startDate4, endDate4),
      pricePerDay: 225000,
      initialPrice: 450000,
    },
  });

  await prisma.negotiation.create({
    data: { bookingId: booking4.id, proposerId: affreteur2.id, price: 450000 },
  });

  // Réservation 5: NEGOTIATING
  const startDate5 = new Date('2025-01-05');
  const endDate5 = new Date('2025-01-06');
  const booking5 = await prisma.booking.create({
    data: {
      vehicleId: vehicle3.id,
      affreteurId: affreteur4.id,
      startDate: startDate5,
      endDate: endDate5,
      startLocation: 'Raffinerie CORAF, Pointe-Noire',
      endLocation: 'Station-service Dolisie',
      status: 'NEGOTIATING',
      numberOfDays: calculateDays(startDate5, endDate5),
      pricePerDay: 750000,
      initialPrice: 750000,
    },
  });

  await prisma.negotiation.createMany({
    data: [
      { bookingId: booking5.id, proposerId: affreteur4.id, price: 600000, createdAt: new Date('2024-12-20T11:00:00') },
      { bookingId: booking5.id, proposerId: freteur2.id, price: 700000, createdAt: new Date('2024-12-20T15:00:00') },
    ],
  });

  // Réservation 6: CANCELLED
  const startDate6 = new Date('2024-12-10');
  const endDate6 = new Date('2024-12-12');
  const booking6 = await prisma.booking.create({
    data: {
      vehicleId: vehicle2.id,
      affreteurId: affreteur5.id,
      startDate: startDate6,
      endDate: endDate6,
      startLocation: 'Entrepôt Supermarché, Brazzaville',
      endLocation: 'Ouesso',
      status: 'CANCELLED',
      numberOfDays: calculateDays(startDate6, endDate6),
      pricePerDay: 280000,
      initialPrice: 560000,
    },
  });

  await prisma.negotiation.create({
    data: { bookingId: booking6.id, proposerId: affreteur5.id, price: 560000 },
  });

  // Réservation 7: COMPLETED historique
  const startDate7 = new Date('2024-10-05');
  const endDate7 = new Date('2024-10-08');
  const booking7 = await prisma.booking.create({
    data: {
      vehicleId: vehicle5.id,
      affreteurId: affreteur4.id,
      startDate: startDate7,
      endDate: endDate7,
      startLocation: 'Port de Pointe-Noire',
      endLocation: 'Entrepôt Brazzaville',
      status: 'COMPLETED',
      numberOfDays: calculateDays(startDate7, endDate7),
      pricePerDay: 150000,
      initialPrice: 450000,
      agreedPrice: 400000,
    },
  });

  await prisma.negotiation.createMany({
    data: [
      { bookingId: booking7.id, proposerId: affreteur4.id, price: 350000, createdAt: new Date('2024-10-01T08:00:00') },
      { bookingId: booking7.id, proposerId: freteur3.id, price: 420000, createdAt: new Date('2024-10-01T12:00:00') },
      { bookingId: booking7.id, proposerId: affreteur4.id, price: 400000, createdAt: new Date('2024-10-02T09:00:00') },
    ],
  });

  // Réservation 8: COMPLETED récente
  const startDate8 = new Date('2024-12-01');
  const endDate8 = new Date('2024-12-05');
  const booking8 = await prisma.booking.create({
    data: {
      vehicleId: vehicle1.id,
      affreteurId: affreteur2.id,
      startDate: startDate8,
      endDate: endDate8,
      startLocation: 'Coopérative Agricole, Niari',
      endLocation: 'Marché Maya-Maya, Brazzaville',
      status: 'COMPLETED',
      numberOfDays: calculateDays(startDate8, endDate8),
      pricePerDay: 350000,
      initialPrice: 1400000,
      agreedPrice: 1300000,
    },
  });

  await prisma.negotiation.createMany({
    data: [
      { bookingId: booking8.id, proposerId: affreteur2.id, price: 1200000, createdAt: new Date('2024-11-28T10:00:00') },
      { bookingId: booking8.id, proposerId: freteur1.id, price: 1350000, createdAt: new Date('2024-11-28T14:00:00') },
      { bookingId: booking8.id, proposerId: affreteur2.id, price: 1300000, createdAt: new Date('2024-11-29T08:00:00') },
    ],
  });

  console.log(`  ✓ Réservations: 8 créées`);

  // ========== AVIS ==========
  console.log('⭐ Création des avis...');

  // Avis pour booking1 (BTP Makounda -> Transport Mbemba)
  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      reviewerId: affreteur1.id,
      revieweeId: freteur1.id,
      rating: 5,
      comment: 'Excellent service ! Camion en parfait état et chauffeur très professionnel. La livraison a été effectuée dans les délais. Je recommande vivement.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      reviewerId: freteur1.id,
      revieweeId: affreteur1.id,
      rating: 5,
      comment: 'Client sérieux et ponctuel. Chantier bien organisé, chargement rapide. Paiement effectué sans problème.',
    },
  });

  // Avis pour booking2 (Marie-Claire -> Congo Logistique)
  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      reviewerId: affreteur3.id,
      revieweeId: freteur2.id,
      rating: 4,
      comment: 'Bon service de transport frigorifique. Mes produits sont arrivés en parfait état. Petit retard à la livraison mais rien de grave.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      reviewerId: freteur2.id,
      revieweeId: affreteur3.id,
      rating: 5,
      comment: 'Très bonne communication. Marchandises bien emballées et prêtes à temps.',
    },
  });

  // Avis pour booking7 (Congo Import Export -> Jean Mokoko)
  await prisma.review.create({
    data: {
      bookingId: booking7.id,
      reviewerId: affreteur4.id,
      revieweeId: freteur3.id,
      rating: 4,
      comment: 'Bon transporteur, fiable et honnête. Le camion était propre et bien entretenu. Prix raisonnable.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking7.id,
      reviewerId: freteur3.id,
      revieweeId: affreteur4.id,
      rating: 5,
      comment: 'Entreprise très professionnelle. Documents en ordre, paiement rapide.',
    },
  });

  // Avis pour booking8 (Coop Nsamba -> Transport Mbemba)
  await prisma.review.create({
    data: {
      bookingId: booking8.id,
      reviewerId: affreteur2.id,
      revieweeId: freteur1.id,
      rating: 5,
      comment: 'Service impeccable pour le transport de nos produits agricoles. Chauffeur compétent qui connaît bien les routes. Nous ferons appel à eux régulièrement.',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking8.id,
      reviewerId: freteur1.id,
      revieweeId: affreteur2.id,
      rating: 4,
      comment: 'Bonne collaboration. Chargement un peu long mais sinon RAS.',
    },
  });

  console.log(`  ✓ Avis: 8 créés`);

  console.log('\n✅ Base de données peuplée avec succès !');
  // ========== PLATFORM SETTINGS ==========
  console.log('⚙️  Configuration des paramètres de la plateforme...');
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      commissionRate: 0, // 0% par défaut (désactivé)
      commissionEnabled: false,
      minimumCommission: 0,
      maximumCommission: null,
    },
  });
  console.log('  ✓ Paramètres de la plateforme configurés');

  console.log('\n📋 Comptes de test (mot de passe: password123):');
  console.log('   Admin:     admin@fretmatch.com');
  console.log('   Fréteur 1: transport.mbemba@gmail.com');
  console.log('   Fréteur 2: logistique.congo@yahoo.fr');
  console.log('   Fréteur 3: jean.mokoko@gmail.com');
  console.log('   Fréteur 4: express.transport@gmail.com');
  console.log('   Affréteur: btp.makounda@gmail.com');
  console.log('   Affréteur: agri.nsamba@yahoo.fr');
  console.log('   Affréteur: marie.bakala@gmail.com');
  console.log('   Affréteur: import.export.congo@gmail.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
