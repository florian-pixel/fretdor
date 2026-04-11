# FRETDOR

FRETDOR est une plateforme de mise en relation pour le transport de fret routier en Côte d'Ivoire. Elle permet aux affréteurs de trouver des camions disponibles et aux fréteurs de rentabiliser leurs trajets.

## Fonctionnalités

- **Gestion des Véhicules** : Les fréteurs peuvent ajouter et gérer leur flotte de camions (type, capacité, disponibilité).
- **Recherche Avancée** : Les affréteurs peuvent rechercher des véhicules par type, localisation et capacité (y compris aptitude piste).
- **Réservation et Négociation** : Système de réservation avec négociation de prix intégrée.
- **Tableau de Bord** : Suivi des demandes et des réservations pour tous les utilisateurs.
- **Paiement Intégré** : Paiement par carte bancaire et Mobile Money (Orange Money, MTN MoMo, Wave) via Paystack.
- **Commission Transparente** : Calcul automatique des commissions avec affichage clair du montant net pour le fréteur.
- **Notifications** : Système de notifications en temps réel pour les réservations, paiements et avis.

## Technologies

- **Frontend** : Next.js (React), Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de Données** : SQLite (Dev) / PostgreSQL (Prod) avec Prisma ORM
- **Authentification** : JWT (Jose)
- **Paiement** : Paystack (Carte + Mobile Money)

## Installation

1. Cloner le dépôt :

   ```bash
   git clone <url-du-repo>
   cd fretdor
   ```

2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :

   ```bash
   cp .env.example .env
   # Éditez .env avec vos clés Paystack
   ```

4. Initialiser la base de données :

   ```bash
   npx prisma migrate dev --name init
   ```

5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

## Structure du Projet

- `src/app` : Pages et routes API de l'application Next.js.
- `src/components` : Composants React réutilisables.
- `src/lib` : Utilitaires (Prisma, Auth, Paystack, Notifications).
- `prisma` : Schéma de base de données et migrations.

## Configuration Paystack

### Clés API

Récupérez vos clés sur [dashboard.paystack.com](https://dashboard.paystack.com/#/settings/developers) :

```env
PAYSTACK_SECRET_KEY="sk_test_xxxx"  # ou sk_live_xxxx en production
PAYSTACK_PUBLIC_KEY="pk_test_xxxx"  # ou pk_live_xxxx en production
```

### Frais de transaction

| Méthode | Frais |
|---------|-------|
| Mobile Money (Wave, MTN, Orange) | 1.95% |
| Carte bancaire locale | 3.2% |
| Carte internationale | 3.8% |

### Test Mobile Money (Côte d'Ivoire)

- **Numéro succès** : `0551234987`
- **Numéro échec** : `0551234988`
- **OTP** : `123456`

### Test Carte Bancaire

- **Numéro** : `4084 0841 1110 3081`
- **CVV** : `408`
- **Expiration** : Toute date future
- **PIN** : `0000`
- **OTP** : `123456`

## Déploiement en Production

### Variables d'Environnement Requises

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/fretdor?schema=public"

# Clé secrète JWT (générez avec: openssl rand -base64 32)
JWT_SECRET="votre-cle-secrete-unique-et-forte"

# Paystack (mode live)
PAYSTACK_SECRET_KEY="sk_live_xxxx"
PAYSTACK_PUBLIC_KEY="pk_live_xxxx"

# URL de l'application
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"
```

### Étapes de Déploiement

1. **Configurer la base de données PostgreSQL**

   - Modifiez `prisma/schema.prisma` : changez `provider = "sqlite"` en `provider = "postgresql"`
   - Configurez `DATABASE_URL` avec votre URL PostgreSQL

2. **Appliquer les migrations**

   ```bash
   npx prisma migrate deploy
   ```

3. **Créer un compte Admin**
   Accédez à `/register` et créez un compte. Pour le premier admin, vous devrez mettre à jour le rôle manuellement dans la base de données :

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@fretdor.ci';
   ```

4. **Configurer les paramètres de la plateforme**
   Connectez-vous en tant qu'admin et accédez à `/admin/settings` pour configurer :
   - Taux de commission (%)
   - Commission minimum et maximum
   - Activation/désactivation de la commission

### Notes Importantes

- Les **PlatformSettings** sont automatiquement créés avec des valeurs par défaut (commission désactivée) lors de la première visite de la page admin.
- Les uploads d'images sont stockés dans `/public/uploads/` - configurez un stockage persistant (S3, Cloudinary) en production.
- Configurez les webhooks Paystack sur votre dashboard pour recevoir les confirmations de paiement.

## Auteur

Développé pour FRETDOR.
