import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  ArrowRight,
  Users,
  Package,
  Star,
  CheckCircle,
  Zap,
  Globe,
  Banknote,
  ChevronRight,
  Clock
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800" />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-8">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Plateforme N°1 du fret en Côte d&apos;Ivoire
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Optimisez vos
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-yellow-300 to-orange-300">
                  transports de fret
                </span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-xl">
                FRETDOR connecte <strong className="text-white">affréteurs</strong> et <strong className="text-white">transporteurs </strong>
                pour réduire les trajets à vide et maximiser la rentabilité de chaque course.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register" className="group bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Transporteurs vérifiés</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Paiements sécurisés</span>
                </div>
              </div>
            </div>

            {/* Right content - Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
                      <Truck className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Simplifiez vos transports</h3>
                    <p className="text-blue-200 max-w-sm">
                      Publiez vos offres, trouvez des transporteurs fiables et gérez vos expéditions en toute simplicité.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium mb-4">
              Le problème
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Le transport routier en Afrique fait face à des défis majeurs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">40% de trajets à vide</h3>
              <p className="text-slate-600 text-sm">Les camions retournent souvent sans chargement, gaspillant carburant et temps.</p>
            </div>
            <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Négociations longues</h3>
              <p className="text-slate-600 text-sm">Trouver un transporteur fiable prend des jours de recherche et d&apos;appels.</p>
            </div>
            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Manque de confiance</h3>
              <p className="text-slate-600 text-sm">Pas de garantie sur la fiabilité des transporteurs ni la sécurité des marchandises.</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4">
              La solution
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              FRETDOR digitalise et optimise le fret routier
            </h2>
            <p className="text-lg text-slate-600">
              Une bourse de fret numérique qui met en relation affréteurs et transporteurs
              de manière transparente, rapide et sécurisée.
            </p>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Pour qui est FRETDOR ?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Une plateforme conçue pour deux acteurs clés du transport de marchandises
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Affréteur Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Affréteur</h3>
                  <p className="text-slate-500">Expéditeur de marchandises</p>
                </div>
              </div>

              <p className="text-slate-600 mb-6">
                Vous avez des marchandises à transporter ? Trouvez rapidement le transporteur
                idéal selon vos critères : type de camion, prix, disponibilité.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Publiez vos demandes de transport</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Comparez les offres et négociez</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Transporteurs vérifiés et notés</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Particulier (CNI) ou entreprise (RCCM)</span>
                </li>
              </ul>

              <Link href="/register?role=affreteur" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                S&apos;inscrire comme affréteur
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Fréteur Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Fréteur</h3>
                  <p className="text-slate-500">Transporteur / Propriétaire de camion</p>
                </div>
              </div>

              <p className="text-slate-600 mb-6">
                Vous possédez des camions ? Remplissez vos trajets retour, trouvez
                de nouveaux clients et maximisez vos revenus.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Publiez vos disponibilités</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Recevez des demandes de fret</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Fixez vos propres tarifs</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Réduisez vos trajets à vide</span>
                </li>
              </ul>

              <Link href="/register?role=freteur" className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700">
                S&apos;inscrire comme fréteur
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              Fonctionnalités
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Une plateforme complète pour gérer vos transports de fret de A à Z
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vérification KYC</h3>
              <p className="text-slate-600 text-sm">
                Tous les utilisateurs sont vérifiés (CNI pour particuliers, RCCM pour entreprises). Transportez en toute confiance.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Négociation flexible</h3>
              <p className="text-slate-600 text-sm">
                Tarification au voyage, au kilomètre ou à la journée. Négociez directement avec le transporteur.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tous types de camions</h3>
              <p className="text-slate-600 text-sm">
                Benne, plateau, citerne, frigorifique, bâché... Trouvez le véhicule adapté à votre marchandise.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Matching intelligent</h3>
              <p className="text-slate-600 text-sm">
                Suggestions automatiques de fret retour pour optimiser chaque trajet et réduire les coûts.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Système d&apos;avis</h3>
              <p className="text-slate-600 text-sm">
                Notez et consultez les avis après chaque mission. Bâtissez votre réputation sur la plateforme.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Couverture nationale</h3>
              <p className="text-slate-600 text-sm">
                Abidjan, Bouaké, San Pedro, Yamoussoukro... Opérez sur tout le territoire ivoirien.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-white/10 text-blue-300 rounded-full text-sm font-medium mb-4">
              Comment ça marche
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Réservez en 3 étapes simples
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Un processus simplifié pour une expérience fluide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute top-12 left-full w-full h-0.5 bg-linear-to-r from-blue-500 to-transparent hidden md:block" />
              <div className="text-center">
                <div className="w-24 h-24 bg-linear-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                  <span className="text-4xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Créez votre compte</h3>
                <p className="text-slate-400">
                  Inscrivez-vous gratuitement en quelques minutes. Choisissez votre profil : affréteur ou fréteur.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-12 left-full w-full h-0.5 bg-linear-to-r from-purple-500 to-transparent hidden md:block" />
              <div className="text-center">
                <div className="w-24 h-24 bg-linear-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                  <span className="text-4xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Trouvez ou proposez</h3>
                <p className="text-slate-400">
                  Publiez votre demande de transport ou parcourez les véhicules disponibles près de vous.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-linear-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <span className="text-4xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Négociez et validez</h3>
              <p className="text-slate-400">
                Échangez sur le prix, confirmez la réservation et suivez votre transport jusqu&apos;à la livraison.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à optimiser vos transports ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez des centaines de transporteurs et affréteurs qui utilisent déjà FRETDOR
              pour développer leur activité.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition shadow-xl flex items-center justify-center">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4 md:mb-0">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              FRETDOR
            </div>
            <p className="text-sm">&copy; 2025 FRETDOR. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
