/**
 * AI-themed imagery for the static home page — each pillar uses a distinct,
 * on-topic visual (courses, directory, automations, rankings).
 */
export const platformPillarImages = {
  /** Online AI learning — laptop + education */
  courses:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=90",
  /** AI chip / tool discovery */
  directory:
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=90",
  /** Robotics + workflow automation */
  automations:
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=90",
  /** Live analytics & ranking dashboards */
  rankings:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=90"
} as const;

export const platformSpotlightTiles = [
  { label: "Courses", href: "/courses", img: platformPillarImages.courses },
  { label: "Directory", href: "/directory", img: platformPillarImages.directory },
  { label: "Rankings", href: "/rankings", img: platformPillarImages.rankings },
  { label: "Automations", href: "/automations", img: platformPillarImages.automations }
] as const;

export const platformHighlightCards = [
  {
    img: platformPillarImages.courses,
    badge: "Courses",
    bc: "rgba(80,200,255,.15)",
    bco: "#50c8ff",
    title: "Learn AI Skills with Structured Video Lessons",
    date: "Self-paced · Certificates included"
  },
  {
    img: platformPillarImages.directory,
    badge: "Directory",
    bc: "rgba(180,130,255,.15)",
    bco: "#b482ff",
    title: "Find the Right AI Tool with Buyer-Grade Proof",
    date: "4,000+ tools · Verified reviews"
  },
  {
    img: platformPillarImages.automations,
    badge: "Automations",
    bc: "rgba(0,200,150,.15)",
    bco: "#00c896",
    title: "Buy Ready-to-Deploy AI Automations with Setup",
    date: "Escrow protected · Creator installs"
  },
  {
    img: platformPillarImages.rankings,
    badge: "Rankings",
    bc: "rgba(255,200,80,.15)",
    bco: "#ffc850",
    title: "Live Rankings: Trending, Top-Rated & Fastest Growing",
    date: "Updated every few seconds"
  }
] as const;

export const platformExploreCards = [
  {
    img: platformPillarImages.courses,
    badge: "Courses",
    bc: "rgba(80,200,255,.15)",
    bco: "#50c8ff",
    title: "Browse the AI Course Academy",
    desc: "Structured video lessons, workbooks, and verified certificates on every course.",
    date: "30+ courses · All levels"
  },
  {
    img: platformPillarImages.directory,
    badge: "Directory",
    bc: "rgba(255,130,80,.15)",
    bco: "#ff8250",
    title: "Search 4,000+ Verified AI Tools",
    desc: "Filter by pricing, category, and verification. Every listing includes buyer reviews and trust scores.",
    date: "Live search · Advanced filters"
  },
  {
    img: platformPillarImages.automations,
    badge: "Automations",
    bc: "rgba(80,200,100,.15)",
    bco: "#50c864",
    title: "Buy Automations with Hands-On Setup",
    desc: "Creators ship workflow files and install them on your machine. Funds held in escrow until you confirm.",
    date: "Escrow protected · One-time payment"
  },
  {
    img: platformPillarImages.rankings,
    badge: "Rankings",
    bc: "rgba(180,130,255,.15)",
    bco: "#b482ff",
    title: "Track Live AI Tool Rankings",
    desc: "Trending in the last 24 hours, top-rated by buyer reviews, and fastest-growing over 30 days.",
    date: "Refreshed every few seconds"
  }
] as const;
