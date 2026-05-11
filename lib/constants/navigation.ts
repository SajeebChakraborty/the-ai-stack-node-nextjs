import { BarChart3, Compass, Crown } from "lucide-react";

export const navItems = [
  { href: "/directory", label: "Directory", icon: Compass },
  { href: "/rankings", label: "Rankings", icon: BarChart3 },
  { href: "/pricing", label: "Pricing", icon: Crown }
];

export const footerGroups = [
  {
    title: "Platform",
    links: [
      { href: "/directory", label: "AI directory" },
      { href: "/rankings", label: "Rankings" },
      { href: "/search", label: "Advanced search" },
      { href: "/pricing", label: "Pricing" }
    ]
  },
  {
    title: "Ecosystem",
    links: [
      { href: "/rankings", label: "Trust rankings" },
      { href: "/directory", label: "Verified tools" },
      { href: "/pricing", label: "Premium plans" },
      { href: "/auth/login", label: "Member login" }
    ]
  }
];
