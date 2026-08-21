// src/config/agency-data.ts

export const SERVICES = [
  "Umrah Packages",
  "Flight Bookings",
  "Hotel Reservations",
  "Visa Consultation",
  "Honeymoon Packages",
  "Group Tours",
  "Pilgrimage",
];

export const PERKS = [
  { 
    title: "Verified Umrah Packages", 
    body: "Guided pilgrimage packages with hotel and transport handled end to end. All packages are vetted for quality and compliance.",
    icon: "🕌"
  },
  { 
    title: "Global Flight Network", 
    body: "Domestic and international fares, ticketed through our verified network. Access to exclusive routes and competitive pricing.",
    icon: "✈️"
  },
  { 
    title: "Premium Hotel Stays", 
    body: "Vetted stays near the Haramain and at every stop on your itinerary. Handpicked for comfort and convenience.",
    icon: "🏨"
  },
  { 
    title: "Hassle-Free Visa Support", 
    body: "Document checklists and application support, explained in plain terms. We handle the paperwork so you don't have to.",
    icon: "📋"
  },
  { 
    title: "Custom Honeymoon Plans", 
    body: "Private itineraries built around the two of you, not a fixed template. Every detail personalized to your preferences.",
    icon: "💑"
  },
  { 
    title: "Group & Family Tours", 
    body: "Coordinated travel for families, jamaats, and corporate groups alike. Special rates and dedicated support.",
    icon: "👥"
  },
];

export const FAQS = [
  {
    q: "What documents do I need for an Umrah visa?",
    a: "A passport valid for at least six months, a recent passport-size photo, and a vaccination certificate where required. We review your documents before submission so nothing gets rejected at the embassy.",
  },
  {
    q: "How far in advance should I book a Hajj or Umrah package?",
    a: "For Hajj, 4–6 months ahead is safest given quota timelines. Umrah is more flexible, but flights and Haram-adjacent hotels fill up fastest during Ramadan — book 6–8 weeks out if you can.",
  },
  {
    q: "Can you arrange group travel for a jamaat or family?",
    a: "Yes — group bookings get a single point of contact, consolidated hotel blocks, and group-rate transport. Tell us your headcount and we'll put a plan together.",
  },
  {
    q: "Do you handle payment in installments?",
    a: "Payment is by bank transfer, and we can discuss a staged schedule for larger packages — ask your agent when you inquire.",
  },
];

// Carousel slides data
export const CAROUSEL_SLIDES = [
  {
    id: 1,
    title: "Sacred Journeys",
    subtitle: "Umrah & Hajj Packages",
    description: "Experience the spiritual journey of a lifetime with our comprehensive pilgrimage packages. From visa assistance to premium accommodations, we handle every detail.",
    cta: "Explore Umrah Packages",
    image: "/images/umrah-hero.jpg", // Will use gradient fallback
    gradient: "from-red-900/80 to-red-600/40",
  },
  {
    id: 2,
    title: "Global Travel",
    subtitle: "Flights & Hotels",
    description: "Access exclusive flight deals and handpicked hotels worldwide. Our network ensures you get the best value for every trip.",
    cta: "Book Now",
    gradient: "from-blue-900/80 to-blue-600/40",
  },
  {
    id: 3,
    title: "Group Adventures",
    subtitle: "Family & Group Tours",
    description: "Create unforgettable memories with your loved ones. Special group rates, custom itineraries, and dedicated support for every traveler.",
    cta: "Plan Your Group Trip",
    gradient: "from-green-900/80 to-green-600/40",
  },
];