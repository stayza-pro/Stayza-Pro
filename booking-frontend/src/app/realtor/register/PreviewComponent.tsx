import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Globe2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { RealtorRegistrationFormData } from "./schema";
import { palette } from "@/app/(marketing)/content";

interface PreviewComponentProps {
  data: Partial<RealtorRegistrationFormData>;
  previewMode: "guest" | "dashboard";
  logoPreview?: string | null;
  language: string;
  currency: string;
  onLanguageChange: (lang: string) => void;
  onCurrencyChange: (curr: string) => void;
  highlightRegion?: string;
  isLoading?: boolean;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({
  data,
  previewMode,
  logoPreview,
  language,
  currency,
  onLanguageChange,
  onCurrencyChange,
  highlightRegion,
  isLoading = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(0.5); // Default zoom for better fit
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Memoized color set to prevent unnecessary recalculations
  const colorSet = useMemo(() => {
    return [
      data.customPrimaryColor || data.primaryColor || palette.primary,
      data.customSecondaryColor || data.secondaryColor || palette.secondary,
      data.customAccentColor || data.accentColor || palette.accent,
      palette.neutralDark,
    ]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 4);
  }, [
    data.customPrimaryColor,
    data.primaryColor,
    data.customSecondaryColor,
    data.secondaryColor,
    data.customAccentColor,
    data.accentColor,
  ]);

  const buildGradient = (angle: string = "135deg") => {
    if (colorSet.length === 0) return palette.primary;
    if (colorSet.length === 1) return colorSet[0];
    const stops = colorSet
      .map((c, idx) => `${c} ${(idx / (colorSet.length - 1)) * 100}%`)
      .join(", ");
    return `linear-gradient(${angle}, ${stops})`;
  };

  // Internationalization
  const t = (key: string): string => {
    const dict: Record<string, Record<string, string>> = {
      en: {
        findStay: "Find Your Perfect Stay",
        discoverLuxury:
          "Discover handpicked luxury properties with world-class amenities",
        featured: "Featured Properties",
        handpicked: "Handpicked luxury stays for discerning travelers",
        location: "Location",
        checkIn: "Check-in",
        checkOut: "Check-out",
        search: "Search",
        aboutRealtor: "About Realtor",
        contact: "Contact",
        properties: "Properties",
        home: "Home",
        bookNow: "Book Now",
        contactSupport: "Contact & Booking Support",
        replyTime: "We typically respond within 15 minutes during the day.",
        browseStays: "Browse Available Stays",
        verifiedListings: "Verified Listings",
        securePayments: "Secure Payments",
        guestSupport: "24/7 Guest Support",
        professionalCleaning: "Professional Cleaning",
      },
      fr: {
        findStay: "Trouvez votre séjour parfait",
        discoverLuxury:
          "Découvrez des propriétés de luxe sélectionnées avec des équipements de classe mondiale",
        featured: "Propriétés en vedette",
        handpicked: "Séjours de luxe sélectionnés pour les voyageurs exigeants",
        location: "Emplacement",
        checkIn: "Arrivée",
        checkOut: "Départ",
        search: "Rechercher",
        aboutRealtor: "À propos du courtier",
        contact: "Contact",
        properties: "Propriétés",
        home: "Accueil",
        bookNow: "Réserver",
        contactSupport: "Support & Réservations",
        replyTime: "Nous répondons généralement en 15 minutes dans la journée.",
        browseStays: "Voir les séjours disponibles",
        verifiedListings: "Annonces Vérifiées",
        securePayments: "Paiements Sécurisés",
        guestSupport: "Support 24/7",
        professionalCleaning: "Nettoyage Professionnel",
      },
      es: {
        findStay: "Encuentra tu estancia perfecta",
        discoverLuxury:
          "Descubre propiedades de lujo seleccionadas con servicios de primer nivel",
        featured: "Propiedades Destacadas",
        handpicked: "Estancias de lujo seleccionadas para viajeros exigentes",
        location: "Ubicación",
        checkIn: "Check-in",
        checkOut: "Check-out",
        search: "Buscar",
        aboutRealtor: "Sobre el agente",
        contact: "Contacto",
        properties: "Propiedades",
        home: "Inicio",
        bookNow: "Reservar",
        contactSupport: "Soporte y Reservas",
        replyTime: "Normalmente respondemos en 15 minutos durante el día.",
        browseStays: "Ver estancias disponibles",
        verifiedListings: "Anuncios Verificados",
        securePayments: "Pagos Seguros",
        guestSupport: "Soporte 24/7",
        professionalCleaning: "Limpieza Profesional",
      },
      de: {
        findStay: "Finden Sie Ihren perfekten Aufenthalt",
        discoverLuxury:
          "Entdecken Sie handverlesene Luxusimmobilien mit erstklassigen Annehmlichkeiten",
        featured: "Ausgewählte Immobilien",
        handpicked:
          "Handverlesene Luxusaufenthalte für anspruchsvolle Reisende",
        location: "Standort",
        checkIn: "Check-in",
        checkOut: "Check-out",
        search: "Suchen",
        aboutRealtor: "Über den Makler",
        contact: "Kontakt",
        properties: "Immobilien",
        home: "Startseite",
        bookNow: "Jetzt buchen",
        contactSupport: "Kontakt & Buchungsservice",
        replyTime:
          "Wir antworten normalerweise innerhalb von 15 Minuten während des Tages.",
        browseStays: "Verfügbare Aufenthalte ansehen",
        verifiedListings: "Verifizierte Angebote",
        securePayments: "Sichere Zahlungen",
        guestSupport: "24/7 Gästeservice",
        professionalCleaning: "Professionelle Reinigung",
      },
      pt: {
        findStay: "Encontre sua estadia perfeita",
        discoverLuxury:
          "Descubra propriedades de luxo selecionadas com comodidades de classe mundial",
        featured: "Propriedades em Destaque",
        handpicked: "Estadias de luxo selecionadas para viajantes exigentes",
        location: "Localização",
        checkIn: "Check-in",
        checkOut: "Check-out",
        search: "Pesquisar",
        aboutRealtor: "Sobre o corretor",
        contact: "Contato",
        properties: "Propriedades",
        home: "Início",
        bookNow: "Reservar Agora",
        contactSupport: "Suporte e Reservas",
        replyTime: "Normalmente respondemos em 15 minutos durante o dia.",
        browseStays: "Ver estadias disponíveis",
        verifiedListings: "Anúncios Verificados",
        securePayments: "Pagamentos Seguros",
        guestSupport: "Suporte 24/7",
        professionalCleaning: "Limpeza Profissional",
      },
    };
    return dict[language]?.[key] || dict.en[key] || key;
  };

  const languageOptions = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
  ];

  // Nigerian-focused currency options
  const currencyOptions = [
    "NGN", // Nigerian Naira first
    "USD",
    "GBP",
    "EUR",
    "ZAR", // South African Rand
    "GHS", // Ghanaian Cedi
    "KES", // Kenyan Shilling
    "CAD",
    "AUD",
    "AED",
    "JPY",
    "CNY",
    "INR",
  ];

  const formatPrice = (usdAmount: number) => {
    try {
      const baseRates: Record<string, number> = {
        USD: 1,
        EUR: 0.93,
        GBP: 0.78,
        NGN: 1650, // Updated Nigerian Naira rate
        CAD: 1.34,
        AUD: 1.5,
        AED: 3.67,
        ZAR: 18.5, // Updated South African Rand
        KES: 130, // Updated Kenyan Shilling
        GHS: 15.8, // Updated Ghanaian Cedi
        JPY: 147,
        CNY: 7.2,
        INR: 83,
      };

      const rate = baseRates[currency] || 1;
      const converted = usdAmount * rate;

      return new Intl.NumberFormat(
        language === "en"
          ? "en-US"
          : language === "fr"
          ? "fr-FR"
          : language === "es"
          ? "es-ES"
          : language === "de"
          ? "de-DE"
          : "pt-BR",
        {
          style: "currency",
          currency: currency,
          minimumFractionDigits: ["JPY", "KRW"].includes(currency) ? 0 : 0,
          maximumFractionDigits: ["JPY", "KRW"].includes(currency) ? 0 : 0,
        }
      ).format(currency === "USD" ? usdAmount : converted);
    } catch {
      // Fallback for unsupported currencies
      const symbols: Record<string, string> = {
        NGN: "₦",
        USD: "$",
        EUR: "€",
        GBP: "£",
      };
      return `${symbols[currency] || currency} ${usdAmount}`;
    }
  };

  // Sample Nigeria-focused properties with USD base prices
  const sampleProperties = [
    {
      name: "Executive Penthouse Suite",
      location: "Victoria Island, Lagos",
      usd: 450,
      rating: "4.9",
      features: "3 bed • 3 bath • Lagos Lagoon view",
      badge: "Luxury",
    },
    {
      name: "Modern Business Apartment",
      location: "Ikeja GRA, Lagos",
      usd: 280,
      rating: "4.8",
      features: "2 bed • 2 bath • Business district",
      badge: "Popular",
    },
    {
      name: "Serene Family Duplex",
      location: "Lekki Phase 2, Lagos",
      usd: 195,
      rating: "4.7",
      features: "3 bed • 2 bath • Gated estate",
      badge: "Great Value",
    },
    {
      name: "Premium Executive Suite",
      location: "Abuja CBD",
      usd: 380,
      rating: "4.9",
      features: "2 bed • 2 bath • Capital city",
      badge: "Business",
    },
  ];

  const HighlightRegion: React.FC<{
    regionId: string;
    children: React.ReactNode;
  }> = ({ regionId, children }) => (
    <motion.div
      animate={
        highlightRegion === regionId
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {children}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="preview-frame border rounded-xl bg-gray-50 relative flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container relative">
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Preview:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              disabled={zoomLevel <= 0.25}
            >
              <span className="text-lg leading-none">−</span>
            </button>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-[4rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.25))}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              disabled={zoomLevel >= 1.5}
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div
        className={`preview-frame border rounded-xl bg-gray-100 relative overflow-hidden ${
          isFullscreen
            ? "fixed inset-4 z-50 bg-black/95 flex items-center justify-center"
            : "h-[600px]"
        }`}
      >
        <div
          className="preview-scale w-full h-full overflow-auto"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top left",
            width: `${100 / zoomLevel}%`,
            height: `${100 / zoomLevel}%`,
          }}
        >
          <AnimatePresence mode="wait">
            {previewMode === "guest" ? (
              <motion.div
                key="guest"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl overflow-hidden shadow-2xl bg-white"
              >
                {/* Hero Section */}
                <HighlightRegion regionId="hero">
                  <div
                    id="home"
                    className="p-8 text-white relative overflow-hidden"
                    style={{
                      backgroundColor: colorSet[0] || "#374151",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          {logoPreview ? (
                            <div className="p-1 bg-white/20 rounded-xl">
                              <Image
                                src={logoPreview}
                                alt="Logo"
                                width={48}
                                height={48}
                                className="rounded-lg object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                              <span className="text-xl font-bold">
                                {data.agencyName
                                  ? data.agencyName.charAt(0).toUpperCase()
                                  : "A"}
                              </span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-bold">
                              {data.agencyName || "Your Premium Agency"}
                            </h2>
                            <p className="text-white/80 text-sm max-w-xs">
                              {data.tagline ||
                                "Luxury Properties & Exceptional Experiences"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium mb-2 bg-white/20 px-3 py-1 rounded-full">
                            {data.customSubdomain || "yourcompany"}.stayza.pro
                          </div>
                          <div className="flex justify-end space-x-1">
                            <div className="w-2 h-2 rounded-full bg-white/40"></div>
                            <div className="w-2 h-2 rounded-full bg-white/60"></div>
                            <div className="w-2 h-2 rounded-full bg-white/80"></div>
                          </div>
                        </div>
                      </div>

                      <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold mb-3">
                          {t("findStay")}
                        </h1>
                        <p className="text-white/90 text-lg">
                          {t("discoverLuxury")}
                        </p>
                      </div>
                    </div>
                  </div>
                </HighlightRegion>

                {/* Navigation Bar */}
                <HighlightRegion regionId="navbar">
                  <div className="px-8 py-4 bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
                    <div className="flex items-center justify-between gap-6">
                      {/* Logo + Slogan */}
                      <div className="flex items-center gap-3 min-w-[160px]">
                        {logoPreview ? (
                          <div
                            className="w-10 h-10 rounded-lg"
                            style={{
                              boxShadow: `0 0 0 2px ${colorSet[0]}40, 0 0 0 4px ${colorSet[0]}20`,
                              overflow: "hidden",
                            }}
                          >
                            <Image
                              src={logoPreview}
                              alt="Logo"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: colorSet[0] }}
                          >
                            {(data.agencyName || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="leading-tight hidden sm:block">
                          <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">
                            {data.agencyName || "Your Agency"}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                            {data.tagline || "Premium Short‑Lets"}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <nav className="hidden md:flex items-center gap-8 mx-auto">
                        {[
                          { label: t("home"), href: "#home" },
                          { label: t("properties"), href: "#properties" },
                          { label: t("aboutRealtor"), href: "#about" },
                          { label: t("contact"), href: "#contact" },
                        ].map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium relative text-gray-600 hover:text-gray-900 transition-colors group"
                          >
                            {link.label}
                            <span
                              className="absolute left-0 -bottom-1 h-0.5 w-0 bg-current group-hover:w-full transition-all duration-300"
                              style={{ color: colorSet[0] }}
                            />
                          </a>
                        ))}
                      </nav>

                      {/* Language & Currency Controls */}
                      <div className="flex items-center gap-3">
                        {/* Language Dropdown */}
                        <div className="relative hidden lg:block">
                          <button
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                            style={{
                              borderColor:
                                (colorSet[0] || palette.primary) + "40",
                            }}
                            onClick={(e) => {
                              const menu = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (menu) menu.classList.toggle("hidden");
                            }}
                          >
                            <Globe2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="hidden absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-40 text-xs">
                            {languageOptions.map((l) => (
                              <button
                                key={l.code}
                                type="button"
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                                  language === l.code
                                    ? "font-medium text-gray-900"
                                    : "text-gray-600"
                                }`}
                                onClick={() => {
                                  onLanguageChange(l.code);
                                  (
                                    document.querySelector(
                                      ".hidden"
                                    ) as HTMLElement
                                  )?.classList.add("hidden");
                                }}
                              >
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Currency Dropdown */}
                        <div className="relative hidden lg:block">
                          <button
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                            style={{
                              borderColor:
                                (colorSet[0] || palette.primary) + "40",
                            }}
                            onClick={(e) => {
                              const menu = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (menu) menu.classList.toggle("hidden");
                            }}
                          >
                            <DollarSign className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="hidden absolute right-0 mt-2 w-36 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1 z-40 text-xs">
                            {currencyOptions.map((curr) => (
                              <button
                                key={curr}
                                type="button"
                                className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 ${
                                  currency === curr
                                    ? "font-medium text-gray-900"
                                    : "text-gray-600"
                                }`}
                                onClick={() => {
                                  onCurrencyChange(curr);
                                  (
                                    document.querySelector(
                                      ".hidden"
                                    ) as HTMLElement
                                  )?.classList.add("hidden");
                                }}
                              >
                                {curr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <a
                          href="#login"
                          className="text-xs font-medium text-gray-600 hover:text-gray-900"
                        >
                          Login
                        </a>
                        <a
                          href="#properties"
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 hidden sm:block"
                        >
                          Sign Up
                        </a>
                        <a
                          href="#properties"
                          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                          style={{
                            backgroundColor: colorSet[0] || "#374151",
                          }}
                        >
                          {t("bookNow")}
                        </a>
                      </div>
                    </div>
                  </div>
                </HighlightRegion>

                {/* Search Section */}
                <HighlightRegion regionId="search">
                  <div className="p-8 bg-gray-50">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {t("location")}
                            </label>
                            <div className="relative">
                              <input
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                                placeholder="Where to?"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {t("checkIn")}
                            </label>
                            <input
                              type="date"
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {t("checkOut")}
                            </label>
                            <input
                              type="date"
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                              style={{ backgroundColor: colorSet[0] }}
                            >
                              {t("search")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </HighlightRegion>

                {/* Properties Grid */}
                <HighlightRegion regionId="properties">
                  <div id="properties" className="p-8 bg-white">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {t("featured")}
                        </h3>
                        <p className="text-gray-600">{t("handpicked")}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sampleProperties.map((property, i) => (
                        <motion.div
                          key={i}
                          whileHover={{
                            y: -4,
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                          }}
                          className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                        >
                          <div className="relative">
                            <div className="bg-gradient-to-br from-gray-200 to-gray-300 aspect-[4/3] flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <svg
                                  className="w-12 h-12 mx-auto mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  {property.name}
                                </span>
                              </div>
                            </div>
                            <div className="absolute top-3 left-3">
                              <span
                                className="px-3 py-1 text-xs font-medium text-white rounded-full"
                                style={{
                                  backgroundColor:
                                    data.accentColor || data.secondaryColor,
                                }}
                              >
                                {property.badge}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                  {property.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {property.location}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {property.features}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                <svg
                                  className="w-3 h-3 text-yellow-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs font-medium text-yellow-700">
                                  {property.rating}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-baseline space-x-1">
                                <span
                                  className="text-2xl font-bold"
                                  style={{
                                    color: colorSet[0] || palette.primary,
                                  }}
                                >
                                  {formatPrice(property.usd)}
                                </span>
                                <span className="text-gray-600 text-sm">
                                  /night
                                </span>
                              </div>
                              <button
                                className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                                style={{
                                  backgroundColor: colorSet[0] || "#374151",
                                }}
                              >
                                {t("bookNow")}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </HighlightRegion>

                {/* About Section */}
                <HighlightRegion regionId="about">
                  <div
                    id="about"
                    className="px-8 py-12 bg-white border-t border-gray-100"
                  >
                    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-10">
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="text-xl font-semibold text-gray-900">
                          About {data.agencyName || "Our Agency"}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {data.tagline ||
                            "We curate high‑quality, well managed short‑let apartments for business and leisure travelers."}
                        </p>
                        <ul className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                          <li className="flex items-center gap-1">
                            ✅ {t("verifiedListings")}
                          </li>
                          <li className="flex items-center gap-1">
                            ✅ {t("securePayments")}
                          </li>
                          <li className="flex items-center gap-1">
                            ✅ {t("guestSupport")}
                          </li>
                          <li className="flex items-center gap-1">
                            ✅ {t("professionalCleaning")}
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-sm font-semibold text-gray-900">
                          Certifications & Trust
                        </h5>
                        <div className="space-y-2 text-xs text-gray-600">
                          <p>
                            • Registered Realtor (
                            {data.corporateRegNumber || "RC 123456"})
                          </p>
                          <p>• Compliant with Local STR Guidelines</p>
                          <p>• Member, Property Association</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </HighlightRegion>

                {/* Contact Section */}
                <HighlightRegion regionId="contact">
                  <div
                    id="contact"
                    className="px-8 py-10 bg-gray-50 border-t border-gray-100"
                  >
                    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
                      <div className="space-y-3 md:col-span-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {t("contactSupport")}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t("replyTime")}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {(data.phoneNumber || "+234 901 234 5678") && (
                            <a
                              href={`https://wa.me/${(
                                data.phoneNumber || "+234 901 234 5678"
                              ).replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              className="px-3 py-2 rounded-md border border-gray-200 bg-white hover:border-gray-300 transition"
                            >
                              WhatsApp{" "}
                              {data.whatsappType === "business"
                                ? "Business"
                                : ""}
                            </a>
                          )}
                          {(data.phoneNumber || "+234 901 234 5678") && (
                            <a
                              href={`tel:${
                                data.phoneNumber || "+234 901 234 5678"
                              }`}
                              className="px-3 py-2 rounded-md border border-gray-200 bg-white hover:border-gray-300 transition"
                            >
                              Call
                            </a>
                          )}
                          <a
                            href={`mailto:${
                              data.businessEmail || "info@example.com"
                            }`}
                            className="px-3 py-2 rounded-md border border-gray-200 bg-white hover:border-gray-300 transition"
                          >
                            Email
                          </a>
                          {/* Social icons */}
                          {Object.entries(data.socials || {})
                            .filter(
                              ([, url]) =>
                                url && typeof url === "string" && url.trim()
                            )
                            .map(([platform, url]) => (
                              <a
                                key={platform}
                                href={url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-2 rounded-md border border-gray-200 bg-white hover:border-gray-300 transition flex items-center gap-1"
                              >
                                <span className="text-xs capitalize">
                                  {platform}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500">
                          Prefer instant confirmation?
                        </p>
                        <a
                          href="#properties"
                          className="inline-block w-full text-center px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition"
                          style={{
                            backgroundColor: colorSet[0] || "#374151",
                          }}
                        >
                          {t("browseStays")} →
                        </a>
                      </div>
                    </div>
                  </div>
                </HighlightRegion>

                {/* Footer */}
                <HighlightRegion regionId="footer">
                  <footer
                    className="pt-12 pb-8 px-8 text-white"
                    style={{
                      backgroundColor: colorSet[0] || "#374151",
                    }}
                  >
                    <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-4">
                      <div className="space-y-4 md:col-span-2">
                        <div className="flex items-center gap-3">
                          {logoPreview ? (
                            <Image
                              src={logoPreview}
                              alt="Logo"
                              width={48}
                              height={48}
                              className="rounded-lg object-cover ring-2 ring-white/20"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                              {(data.agencyName || "A").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h5 className="font-bold text-xl">
                              {data.agencyName || "Your Agency"}
                            </h5>
                            <p className="text-white/70 text-xs max-w-sm">
                              {data.tagline ||
                                "Premium short‑term rentals & managed luxury stays."}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                          {Object.entries(data.socials || {})
                            .filter(
                              ([, url]) =>
                                url && typeof url === "string" && url.trim()
                            )
                            .map(([platform, url]) => (
                              <a
                                key={platform}
                                href={url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition capitalize"
                              >
                                {platform}
                              </a>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <h6 className="font-semibold tracking-wide">Company</h6>
                        <ul className="space-y-1 text-white/70">
                          <li>Careers</li>
                          <li>Partnerships</li>
                          <li>Press & Media</li>
                        </ul>
                      </div>
                      <div className="space-y-3 text-sm">
                        <h6 className="font-semibold tracking-wide">Support</h6>
                        <ul className="space-y-1 text-white/70">
                          <li>Help Center</li>
                          <li>Guest Safety</li>
                          <li>Contact</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/60">
                      © {new Date().getFullYear()}{" "}
                      {data.agencyName || "Your Agency"}. Powered by Stayza.
                    </div>
                  </footer>
                </HighlightRegion>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-2xl overflow-hidden shadow-2xl bg-white"
              >
                {/* Dashboard Content */}
                <div className="flex h-[700px]">
                  {/* Sidebar */}
                  <div
                    className="w-72 text-white relative overflow-hidden"
                    style={{ backgroundColor: colorSet[0] || "#374151" }}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                      <div className="absolute top-1/2 right-0 w-20 h-20 bg-white rounded-full -mr-10"></div>
                    </div>

                    <div className="relative z-10 p-6">
                      {/* Logo & Brand */}
                      <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-white/20">
                        {logoPreview ? (
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1 ring-2 ring-white/30">
                            <Image
                              src={logoPreview}
                              alt="Logo"
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                            <span className="text-lg font-bold">
                              {data.agencyName
                                ? data.agencyName.charAt(0).toUpperCase()
                                : "D"}
                            </span>
                          </div>
                        )}
                        <div>
                          <h2 className="font-bold text-lg">Stayza</h2>
                          <p className="text-white/80 text-sm truncate max-w-36">
                            {data.agencyName || "Professional Dashboard"}
                          </p>
                        </div>
                      </div>

                      {/* Navigation */}
                      <nav className="space-y-2">
                        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium bg-white/20 backdrop-blur-sm border-l-4 border-white shadow-lg">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l2.293 2.293a1 1 0 001.414-1.414l-9-9z" />
                          </svg>
                          <span>Dashboard</span>
                        </div>
                        <div className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer group">
                          <svg
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z"
                            />
                          </svg>
                          <span>Properties</span>
                          <span className="ml-auto bg-white/20 text-xs px-2 py-1 rounded-full">
                            47
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer group">
                          <svg
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            />
                          </svg>
                          <span>Bookings</span>
                          <span className="ml-auto bg-red-400 text-xs px-2 py-1 rounded-full animate-pulse">
                            12
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer group">
                          <svg
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                          </svg>
                          <span>Payments</span>
                        </div>
                        <div className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer group">
                          <svg
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>Reviews</span>
                          <span className="ml-auto bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">
                            4.9
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer group">
                          <svg
                            className="w-5 h-5 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                            />
                          </svg>
                          <span>Settings</span>
                        </div>
                      </nav>

                      {/* Quick Actions */}
                      <div className="mt-8 pt-6 border-t border-white/20">
                        <button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all px-4 py-3 rounded-xl flex items-center justify-center space-x-2 group">
                          <svg
                            className="w-4 h-4 group-hover:scale-110 transition-transform"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            />
                          </svg>
                          <span className="font-medium">Add Property</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 bg-gray-50 overflow-auto">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-8 py-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            Welcome back, {data.fullName || "John"} 👋
                          </h1>
                          <p className="text-gray-600 flex items-center space-x-2">
                            <span>Your website:</span>
                            <span
                              className="font-semibold px-2 py-1 rounded-md text-sm"
                              style={{
                                color: data.primaryColor || palette.primary,
                                backgroundColor:
                                  (data.primaryColor || palette.primary) + "15",
                              }}
                            >
                              {data.customSubdomain || "yourcompany"}.stayza.pro
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                            <span>Copy Link</span>
                          </button>
                          <button
                            className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                            style={{
                              backgroundColor:
                                data.primaryColor || palette.primary,
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                            <span>Preview Site</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-8">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-4 gap-6 mb-8">
                        {[
                          {
                            label: "Total Properties",
                            value: "47",
                            change: "+12%",
                            changeType: "increase",
                            color: data.primaryColor || palette.primary,
                            icon: (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l2.293 2.293a1 1 0 001.414-1.414l-9-9z" />
                              </svg>
                            ),
                          },
                          {
                            label: "Bookings This Month",
                            value: "156",
                            change: "+23%",
                            changeType: "increase",
                            color: data.secondaryColor || palette.secondary,
                            icon: (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                />
                              </svg>
                            ),
                          },
                          {
                            label: "Monthly Revenue",
                            value: formatPrice(12400),
                            change: "+8%",
                            changeType: "increase",
                            color: data.accentColor || palette.accent,
                            icon: (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                />
                              </svg>
                            ),
                          },
                          {
                            label: "Occupancy Rate",
                            value: "89%",
                            change: "+5%",
                            changeType: "increase",
                            color: "#10B981",
                            icon: (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                                />
                              </svg>
                            ),
                          },
                        ].map((stat, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div
                                className="p-3 rounded-lg"
                                style={{
                                  backgroundColor: stat.color + "15",
                                  color: stat.color,
                                }}
                              >
                                {stat.icon}
                              </div>
                              <div
                                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                                  stat.changeType === "increase"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <svg
                                  className={`w-3 h-3 mr-1 ${
                                    stat.changeType === "increase"
                                      ? "rotate-0"
                                      : "rotate-180"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                  />
                                </svg>
                                {stat.change}
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {stat.value}
                              </div>
                              <div className="text-sm text-gray-600">
                                {stat.label}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts & Tables Grid */}
                      <div className="grid grid-cols-3 gap-6">
                        {/* Recent Bookings */}
                        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Recent Bookings
                              </h3>
                              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                View all
                              </button>
                            </div>
                          </div>
                          <div className="overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-gray-600 font-medium">
                                    Guest
                                  </th>
                                  <th className="px-6 py-3 text-left text-gray-600 font-medium">
                                    Property
                                  </th>
                                  <th className="px-6 py-3 text-left text-gray-600 font-medium">
                                    Check-in
                                  </th>
                                  <th className="px-6 py-3 text-left text-gray-600 font-medium">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-gray-600 font-medium">
                                    Amount
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {[
                                  {
                                    guest: "John Doe",
                                    property: "Lekki Penthouse",
                                    date: "Oct 15",
                                    status: "confirmed",
                                    amount: 320,
                                    avatar: "JD",
                                  },
                                  {
                                    guest: "Sarah Wilson",
                                    property: "VI Studio",
                                    date: "Oct 18",
                                    status: "pending",
                                    amount: 180,
                                    avatar: "SW",
                                  },
                                  {
                                    guest: "Mike Chen",
                                    property: "Ikoyi Apartment",
                                    date: "Oct 20",
                                    status: "confirmed",
                                    amount: 250,
                                    avatar: "MC",
                                  },
                                ].map((booking, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center space-x-3">
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                        style={{
                                          backgroundColor:
                                            data.primaryColor ||
                                            palette.primary,
                                        }}
                                      >
                                        {booking.avatar}
                                      </div>
                                      <span className="font-medium text-gray-900">
                                        {booking.guest}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                      {booking.property}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                      {booking.date}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          booking.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {booking.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">
                                      {formatPrice(booking.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Revenue Chart Placeholder */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Revenue Trend
                          </h3>
                          <div className="space-y-4">
                            {/* Mock chart bars */}
                            <div className="flex items-end space-x-2 h-32">
                              {[40, 65, 45, 80, 60, 85, 90].map((height, i) => (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center"
                                >
                                  <div
                                    className="w-full rounded-t"
                                    style={{
                                      height: `${height}%`,
                                      backgroundColor:
                                        data.primaryColor || palette.primary,
                                      opacity: 0.8,
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">
                                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Growth indicator */}
                            <div
                              className="p-4 rounded-lg"
                              style={{
                                backgroundColor:
                                  (data.primaryColor || palette.primary) + "10",
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  This week
                                </span>
                                <span className="text-green-600 text-sm font-medium">
                                  +23%
                                </span>
                              </div>
                              <div className="text-xl font-bold text-gray-900 mt-1">
                                {formatPrice(2840)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions & Notifications */}
                      <div className="mt-6 grid grid-cols-2 gap-6">
                        {/* Next Payout */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <svg
                                  className="w-5 h-5 text-green-600 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                </svg>
                                Next Payout
                              </h4>
                              <p className="text-gray-700 mb-3">
                                <span className="text-2xl font-bold text-green-700">
                                  {formatPrice(2840)}
                                </span>{" "}
                                <span className="text-sm">available Oct 3</span>
                              </p>
                              <button
                                className="text-sm font-medium px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all"
                                style={{
                                  color: data.primaryColor || palette.primary,
                                }}
                              >
                                View Details →
                              </button>
                            </div>
                            <div className="text-4xl">💳</div>
                          </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">
                            Quick Stats
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Avg. Rating</span>
                              <div className="flex items-center space-x-1">
                                <svg
                                  className="w-4 h-4 text-yellow-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-semibold">4.9</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">
                                Response Time
                              </span>
                              <span className="font-semibold text-green-600">
                                12 min
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">
                                Acceptance Rate
                              </span>
                              <span className="font-semibold">96%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PreviewComponent;
