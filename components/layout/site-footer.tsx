import Link from "next/link";

type SiteFooterProps = {
  categories?: Array<{ name: string; slug: string }>;
};

const contentLinks = [
  { label: "Latest Articles", href: "/directory" },
  { label: "Popular", href: "/rankings" },
  { label: "Categories", href: "/directory" },
  { label: "Newsletter", href: "/pricing" }
];

const platformLinks = [
  { label: "Directory", href: "/directory" },
  { label: "Courses", href: "/courses" },
  { label: "Automations", href: "/automations" },
  { label: "Rankings", href: "/rankings" },
  { label: "Pricing", href: "/pricing" }
];

const resourceLinks = [
  { label: "MCP Guide", href: "/directory" },
  { label: "AI Workflow Map", href: "/directory" },
  { label: "Prompt Engineering", href: "/directory" },
  { label: "Case Studies", href: "/directory" }
];

const companyLinks = [
  { label: "About Us", href: "/" },
  { label: "Contact", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Terms of Use", href: "/" }
];

function FooterLinkGroup({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h5 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: "13px", margin: "0 0 13px" }}>
        {title}
      </h5>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", padding: 0, margin: 0 }}>
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className="ft-link">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ categories = [] }: SiteFooterProps) {
  const allContentLinks = [
    ...contentLinks,
    ...categories.slice(0, 3).map((c) => ({ label: c.name, href: `/categories/${c.slug}` }))
  ];

  return (
    <footer style={{ padding: "48px 60px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#060918", color: "#fff", fontFamily: "inherit" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(4,1fr)", gap: "36px", marginBottom: "38px" }}>

        {/* Brand column */}
        <div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "13px", letterSpacing: "1.8px", textDecoration: "none", color: "#fff" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#7c5cff,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3.5" fill="white" opacity=".9"/>
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1" opacity=".35" fill="none"/>
              </svg>
            </div>
            THE AI STACKS
          </Link>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginTop: "10px", maxWidth: "200px" }}>
            The intelligence layer for AI builders. Insights, tools, and systems for building with AI in production.
          </p>
          {/* Social icons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <div className="ft-soc" title="X">𝕏</div>
            <div className="ft-soc" title="GitHub">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div className="ft-soc" title="LinkedIn" style={{ fontSize: "9px", fontWeight: 700 }}>in</div>
            <div className="ft-soc" title="Email">✉</div>
          </div>
        </div>

        <FooterLinkGroup title="Content" links={allContentLinks} />
        <FooterLinkGroup title="Platform" links={platformLinks} />
        <FooterLinkGroup title="Resources" links={resourceLinks} />
        <FooterLinkGroup title="Company" links={companyLinks} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.28)" }}>
        © 2024 The AI Stacks. All rights reserved.
      </div>
    </footer>
  );
}
