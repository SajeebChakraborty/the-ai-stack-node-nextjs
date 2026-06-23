"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { HomePageData } from "@/lib/content/home-static";
import {
  platformExploreCards,
  platformHighlightCards,
  platformSpotlightTiles
} from "@/lib/content/home-images";

export type { HomePageData };

/* ─── Particle canvas ─── */
function ParticleCanvas({ count = 90 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x:number; y:number; z:number; vx:number; vy:number; vz:number; r:number; hue:number };
    const hues = [195, 260, 155, 220, 280];
    const pts: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.22,
      vz: Math.random() * 0.6 + 0.2,
      r: Math.random() * 2.2 + 0.4,
      hue: hues[Math.floor(Math.random() * hues.length)]
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.z = (p.z + p.vz) % 800;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const s   = 800 / (800 + p.z);
        const sx  = cx + (p.x - cx) * s;
        const sy  = cy + (p.y - cy) * s;
        const sr  = Math.max(0.1, p.r * s);
        const a   = Math.min(1, s * 0.85);
        ctx.save();
        ctx.shadowColor = `hsl(${p.hue},100%,70%)`;
        ctx.shadowBlur  = 10 * s;
        ctx.fillStyle   = `hsla(${p.hue},100%,75%,${a})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [count]);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} />;
}

/* ─── 3-D mouse-tilt hook (preserves base rotateX/Y via additive offset) ─── */
function useTilt(intensity = 5, baseX = 8, baseY = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transition = "transform 0.08s ease";
    el.style.transform  = `rotateX(${baseX + -y * intensity}deg) rotateY(${baseY + x * intensity}deg)`;
  }, [intensity, baseX, baseY]);
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transition = "transform 0.9s cubic-bezier(0.23,1,0.32,1)";
    el.style.transform  = `rotateX(${baseX}deg) rotateY(${baseY}deg)`;
  }, [baseX, baseY]);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [onMove, onLeave]);
  return ref;
}

/* ─── Single-card 3-D tilt ─── */
function TiltCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useTilt(8);
  return <div ref={ref} className={className} style={{ ...style, transformStyle: "preserve-3d", willChange: "transform" }}>{children}</div>;
}

/* ─── Intersection observer reveal ─── */
function RevealSection({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.animationDelay = `${delay}s`; el.classList.add("section-reveal"); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} style={{ opacity: 0, ...style }}>{children}</div>;
}

const filterTabs = ["All","Directory","Courses","Automations","Rankings","Marketplace"];

export function HomePageView({ data }: { data: HomePageData }) {
  const [activeTab, setActiveTab] = useState("All");
  const panelRef = useTilt(10);

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:"#060918", color:"#fff", overflowX:"hidden" }}>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      {/* Hero – outer has NO overflow:hidden so 3D panel is never clipped */}
      <section style={{ position:"relative", minHeight:"600px" }}>

        {/* Background layer – self-contained overflow:hidden so blobs/particles don't cause scroll */}
        <div aria-hidden style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
          <video autoPlay loop muted playsInline
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.13 }}>
            <source src="https://assets.mixkit.co/videos/preview/mixkit-dark-technological-background-with-gradient-4895-large.mp4" type="video/mp4" />
          </video>
          <ParticleCanvas count={100} />
          <div className="aurora-blob-1" style={{ position:"absolute", top:"-120px", left:"-80px", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(100,60,255,.22),transparent 65%)" }} />
          <div className="aurora-blob-2" style={{ position:"absolute", top:"80px", right:"-100px", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(0,180,255,.18),transparent 65%)" }} />
          <div className="aurora-blob-3" style={{ position:"absolute", bottom:"-80px", left:"40%", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(120,0,255,.15),transparent 65%)" }} />
          <div className="scan-line" style={{ position:"absolute", left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,rgba(0,212,255,.4),transparent)" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"30px 30px" }} />
        </div>

        {/* Content grid – z above background, overflow visible so panel renders fully */}
        <div style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"56px", alignItems:"center", padding:"80px 60px" }}>

          {/* Left */}
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"6px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"40px", fontSize:"12px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"22px", letterSpacing:".5px" }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#00d4ff", display:"inline-block", boxShadow:"0 0 8px #00d4ff" }} />
              TheAiStack · Courses · Directory · Automations
            </div>
            <h1 style={{ fontSize:"58px", lineHeight:1.06, fontWeight:900, letterSpacing:"-2px", margin:"0 0 18px" }}>
              Master AI.<br />
              <span className="gradient-flow" style={{
                background:"linear-gradient(90deg,#8b5cf6,#00d4ff,#00c896,#8b5cf6)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                backgroundSize:"200% 200%"
              }}>
                Discover What Works
              </span>
            </h1>
            <p style={{ fontSize:"16px", color:"rgba(255,255,255,0.56)", lineHeight:1.7, maxWidth:"420px", margin:"0 0 32px" }}>
              Video courses, a verified AI tool directory, live rankings, and ready-to-deploy automations — one platform to learn, compare, and ship with confidence.
            </p>
            <div style={{ display:"flex", gap:"14px", marginBottom:"26px", flexWrap:"wrap" }}>
              <Link href="/courses" className="neon-border" style={{
                display:"inline-flex", alignItems:"center", gap:"8px", padding:"13px 28px",
                background:"linear-gradient(135deg,rgba(0,180,216,.9),rgba(0,100,200,.9))",
                borderRadius:"10px", color:"#fff", fontSize:"15px", fontWeight:700, textDecoration:"none",
                boxShadow:"0 6px 28px rgba(0,130,255,.45)", transition:"transform .2s,box-shadow .2s"
              }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.transform="translateY(-3px) scale(1.03)"; el.style.boxShadow="0 12px 40px rgba(0,180,255,.6)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.transform=""; el.style.boxShadow="0 6px 28px rgba(0,130,255,.45)"; }}
              >
                Start learning →
              </Link>
              <Link href="/directory" style={{
                display:"inline-flex", alignItems:"center", padding:"13px 28px",
                background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:"10px", color:"#fff", fontSize:"15px", fontWeight:500, textDecoration:"none",
                backdropFilter:"blur(8px)", transition:"background .2s,transform .2s"
              }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.14)"; el.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.07)"; el.style.transform=""; }}
              >
                Explore directory
              </Link>
            </div>
            {/* Trust badges */}
            <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>
              {[
                { icon:"🎓", text:"Video courses" },
                { icon:"✓",  text:"Verified tools" },
                { icon:"📈", text:"Live rankings" },
                { icon:"⚡", text:"Automations" }
              ].map(({ icon, text }) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"rgba(255,255,255,0.48)" }}>
                  <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px" }}>{icon}</div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right – whole panel tilted as one unit */}
          <div style={{ perspective:"1200px", perspectiveOrigin:"48% 52%", height:"440px" }}>
            <div
              ref={panelRef}
              style={{
                position:"relative", height:"100%",
                transform:"rotateX(8deg) rotateY(12deg)",
                transformStyle:"preserve-3d",
                willChange:"transform",
                transition:"transform 0.08s ease"
              }}
            >
              {/* ── Background chrome (overflow:hidden) – planet, stars, rings ── */}
              <div style={{
                position:"absolute", inset:0, borderRadius:"20px",
                background:"linear-gradient(160deg,#080e28 0%,#050918 60%,#030710 100%)",
                border:"1px solid rgba(60,100,255,0.22)",
                overflow:"hidden",
                boxShadow:"0 28px 70px rgba(0,0,0,.8), 8px 16px 50px rgba(0,0,0,.5)"
              }}>
                <div className="star-dots-anim" aria-hidden style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  backgroundImage:"radial-gradient(rgba(255,255,255,0.55) 1px,transparent 1px),radial-gradient(rgba(255,255,255,0.25) 1px,transparent 1px)",
                  backgroundSize:"36px 36px,72px 72px", backgroundPosition:"0 0,18px 18px"
                }} />
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:1, width:"290px", height:"290px" }}>
                  <div className="ring-orbit-1" style={{ position:"absolute", inset:"-18%", borderRadius:"50%", border:"1px solid rgba(80,150,255,.14)", boxShadow:"0 0 40px rgba(60,130,255,.15)" }} />
                  <div className="ring-orbit-2" style={{ position:"absolute", inset:"-34%", borderRadius:"50%", border:"1px solid rgba(100,160,255,.1)" }} />
                  <div className="ring-orbit-3" style={{ position:"absolute", inset:"-10%", borderRadius:"50%", border:"1px dashed rgba(0,200,255,.14)" }} />
                  <div className="planet-glow-anim" style={{
                    width:"100%", height:"100%", borderRadius:"50%",
                    background:"radial-gradient(circle at 35% 30%,#6aacff 0%,#3070e8 20%,#1040c0 42%,#060e38 68%,transparent 100%)",
                    boxShadow:"0 0 40px rgba(60,130,255,1),0 0 80px rgba(50,110,255,.9),0 0 140px rgba(40,90,255,.65),0 0 220px rgba(30,70,240,.38),0 0 320px rgba(20,55,220,.2)",
                    position:"relative", overflow:"hidden"
                  }}>
                    <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"repeating-linear-gradient(0deg,transparent 0px,transparent 13px,rgba(140,200,255,.11) 13px,rgba(140,200,255,.11) 14px),repeating-linear-gradient(90deg,transparent 0px,transparent 21px,rgba(110,170,255,.07) 21px,rgba(110,170,255,.07) 22px)" }} />
                    <div style={{ position:"absolute", top:"9%", left:"11%", width:"40%", height:"30%", borderRadius:"50%", background:"rgba(210,235,255,.22)", filter:"blur(9px)" }} />
                  </div>
                </div>
              </div>

              {/* ── Cards: sibling of chrome, NOT inside overflow:hidden ── */}
              <div style={{ position:"absolute", inset:"16px", zIndex:2, display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"1fr 1fr", gap:"14px" }}>
                {[
                  { cls:"hcard-anim hcard-anim-1", bg:"rgba(0,180,255,.2)", sh:"rgba(0,180,255,.15)", accent:"#00d4ff",
                    title:"AI Courses", desc:"Structured video lessons with certificates.",
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg> },
                  { cls:"hcard-anim hcard-anim-2", bg:"rgba(0,220,120,.18)", sh:"rgba(0,220,120,.12)", accent:"#00dc78",
                    title:"Tool Directory", desc:"4,000+ AI tools with buyer proof.",
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00dc78" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg> },
                  { cls:"hcard-anim hcard-anim-3", bg:"rgba(160,90,255,.2)", sh:"rgba(160,90,255,.15)", accent:"#b482ff",
                    title:"Automations", desc:"Buy workflows with hands-on setup.",
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b482ff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg> },
                  { cls:"hcard-anim hcard-anim-4", bg:"rgba(80,100,255,.2)", sh:"rgba(80,100,255,.15)", accent:"#6496ff",
                    title:"Live Rankings", desc:"Trending, rated, and fastest-growing tools.",
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6496ff" strokeWidth="2" strokeLinecap="round"><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="16" y="4" width="4" height="16" rx="1"/><line x1="2" y1="21" x2="22" y2="21"/></svg> }
                ].map(({ cls, bg, sh, accent, title, desc, icon }) => (
                  <div
                    key={title}
                    className={cls}
                    style={{
                      background:"rgba(6,12,42,0.6)",
                      border:"1px solid rgba(90,130,255,0.22)",
                      borderRadius:"14px", padding:"18px",
                      backdropFilter:"blur(14px)",
                      transition:"transform .3s, box-shadow .3s, border-color .3s",
                      cursor:"pointer", position:"relative", overflow:"hidden"
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "translateY(-5px)";
                      el.style.boxShadow = "0 16px 40px rgba(0,0,0,.7)";
                      el.style.borderColor = "rgba(110,160,255,0.42)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "";
                      el.style.boxShadow = "";
                      el.style.borderColor = "rgba(90,130,255,0.22)";
                    }}
                  >
                    <div aria-hidden style={{ position:"absolute", top:0, left:"15%", right:"15%", height:"1px", background:`linear-gradient(90deg,transparent,${accent}55,transparent)`, pointerEvents:"none" }} />
                    <div className="hcard-icon-pulse" style={{ width:"38px", height:"38px", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px", background:bg, boxShadow:`0 0 10px ${sh}` }}>
                      {icon}
                    </div>
                    <h4 style={{ fontSize:"12.5px", fontWeight:700, marginBottom:"5px", letterSpacing:"-.1px" }}>{title}</h4>
                    <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.52)", lineHeight:1.55, margin:0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          LATEST INTELLIGENCE
      ══════════════════════════════ */}
      <section style={{ padding:"16px 60px 60px", position:"relative" }}>
        <RevealSection>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"28px" }}>
            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Platform Highlights</span>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <Link href="/directory" style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)", textDecoration:"none", transition:"color .2s" }}>Browse directory →</Link>
              {["←","→"].map(a => (
                <div key={a} style={{ width:"32px", height:"32px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"13px", transition:"background .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.05)"; }}
                >{a}</div>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px" }}>
            {platformHighlightCards.map(({ img, badge, bc, bco, title, date }, i) => (
              <RevealSection key={title} delay={i * 0.08}>
                <TiltCard style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden", cursor:"pointer", transition:"border-color .3s,box-shadow .3s", height:"100%" }}>
                  <div style={{ height:"140px", position:"relative", overflow:"hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={badge} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.5) saturate(1.2)", transition:"transform .5s,filter .5s" }}
                      onMouseEnter={e => { const el=e.currentTarget as HTMLImageElement; el.style.transform="scale(1.08)"; el.style.filter="brightness(.7) saturate(1.3)"; }}
                      onMouseLeave={e => { const el=e.currentTarget as HTMLImageElement; el.style.transform=""; el.style.filter="brightness(.5) saturate(1.2)"; }}
                    />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 25%,rgba(4,8,28,.9) 100%)" }} />
                  </div>
                  <div style={{ padding:"16px" }}>
                    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"20px", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", marginBottom:"10px", background:bc, color:bco }}>{badge}</span>
                    <h4 style={{ fontSize:"13.5px", fontWeight:700, lineHeight:1.4, marginBottom:"12px" }}>{title}</h4>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.36)" }}>{date}</span>
                      <span style={{ fontSize:"16px", color:"rgba(255,255,255,0.3)", transition:"color .2s" }}>→</span>
                    </div>
                  </div>
                </TiltCard>
              </RevealSection>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ══════════════════════════════
          FEATURED DEEP-DIVE BANNER
      ══════════════════════════════ */}
      <div style={{ padding:"40px 60px 64px" }}>
        <div style={{
          position:"relative", borderRadius:"24px",
          border:"1px solid rgba(255,255,255,0.08)",
          minHeight:"340px", display:"flex", alignItems:"center",
          background:"linear-gradient(135deg,#070d24 0%,#0b1240 30%,#06091a 60%,#0a0e28 100%)",
          overflow:"visible"
        }}>
          {/* CSS animated background – always renders regardless of network */}
          <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
            <div className="aurora-blob-1" style={{ position:"absolute", top:"-60px", right:"20%", width:"380px", height:"380px", borderRadius:"50%", background:"radial-gradient(circle,rgba(60,40,200,.28),transparent 65%)" }} />
            <div className="aurora-blob-2" style={{ position:"absolute", bottom:"-80px", right:"-60px", width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle,rgba(0,150,255,.22),transparent 65%)" }} />
            <div className="aurora-blob-3" style={{ position:"absolute", top:"20%", right:"38%", width:"200px", height:"200px", borderRadius:"50%", background:"radial-gradient(circle,rgba(100,60,255,.18),transparent 65%)" }} />
            <div aria-hidden style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
          </div>
          {/* Content */}
          <div style={{ position:"relative", zIndex:2, padding:"52px 60px", maxWidth:"560px" }}>
            <div style={{ display:"inline-block", padding:"4px 12px", background:"rgba(0,212,255,.15)", border:"1px solid rgba(0,212,255,.3)", borderRadius:"20px", fontSize:"11px", fontWeight:700, color:"#00d4ff", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:"20px" }}>Featured Spotlight</div>
            <h2 style={{ fontSize:"34px", fontWeight:800, lineHeight:1.2, marginBottom:"16px", letterSpacing:"-.5px" }}>
              One Platform for<br />Learning, Discovery &amp; Automation
            </h2>
            <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:"30px" }}>
              Enroll in video courses, compare AI tools with real buyer proof, track live rankings, and buy automations with escrow-protected setup — all on TheAiStack.
            </p>
            <Link href="/courses" style={{
              display:"inline-flex", alignItems:"center", gap:"10px", padding:"13px 26px",
              background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.22)",
              borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:600, textDecoration:"none",
              backdropFilter:"blur(12px)", transition:"background .2s,transform .2s"
            }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.18)"; el.style.transform="translateX(4px)"; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.1)"; el.style.transform=""; }}
            >
              ▶ Explore courses
            </Link>
          </div>
          {/* Right image grid — platform pillars */}
          <div style={{ position:"absolute", right:"48px", top:"50%", transform:"translateY(-50%)", zIndex:2, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            {platformSpotlightTiles.map(({ label, href, img }) => (
              <Link
                key={label}
                href={href}
                style={{
                  position:"relative", width:"148px", height:"96px", borderRadius:"14px",
                  overflow:"hidden", border:"1px solid rgba(255,255,255,0.14)",
                  boxShadow:"0 12px 32px rgba(0,0,0,.45)", textDecoration:"none",
                  transition:"transform .25s, box-shadow .25s, border-color .25s"
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.transform = "translateY(-4px) scale(1.03)";
                  el.style.boxShadow = "0 18px 44px rgba(0,0,0,.55)";
                  el.style.borderColor = "rgba(0,212,255,0.35)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.transform = "";
                  el.style.boxShadow = "0 12px 32px rgba(0,0,0,.45)";
                  el.style.borderColor = "rgba(255,255,255,0.14)";
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${label} on TheAiStack`}
                  style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.72) saturate(1.15)", transition:"transform .45s, filter .45s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLImageElement; el.style.transform = "scale(1.08)"; el.style.filter = "brightness(.85) saturate(1.25)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLImageElement; el.style.transform = ""; el.style.filter = "brightness(.72) saturate(1.15)"; }}
                />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 55%,rgba(4,8,28,.45) 100%)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          STOP VIBE CODING
      ══════════════════════════════ */}
      <section style={{ padding:"72px 60px", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)", textAlign:"center", position:"relative" }}>
        {/* background grid glow */}
        <div aria-hidden style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"800px", height:"800px", borderRadius:"50%", background:"radial-gradient(circle,rgba(80,40,255,.08) 0%,transparent 60%)", pointerEvents:"none" }} />
        <RevealSection>
          <h2 style={{ fontSize:"38px", fontWeight:900, letterSpacing:"-.8px", marginBottom:"14px" }}>
            Stop Guessing.{" "}
            <span className="gradient-flow" style={{ background:"linear-gradient(90deg,#8b5cf6,#00d4ff,#00c896,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", backgroundSize:"200% 200%" }}>
              Start Building with Proof.
            </span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"16px", marginBottom:"48px", maxWidth:"580px", margin:"0 auto 48px" }}>
            TheAiStack combines courses, a verified tool directory, live rankings, and an automation marketplace — so you learn, compare, and ship with confidence.
          </p>
        </RevealSection>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"22px", textAlign:"left" }}>
          {[
            { bg:"rgba(0,200,220,.13)", title:"Video Courses", delay:0,
              icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8dc" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>,
              items:["HD lesson videos & workbooks","Track progress on every course","Earn verified PDF certificates","Buy courses or unlock with membership"] },
            { bg:"rgba(130,80,255,.13)", title:"AI Tool Directory", delay:0.1,
              icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8250ff" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
              items:["4,000+ AI tools indexed","Filter by pricing & category","Verified reviews & trust scores","Promo videos on every listing"] },
            { bg:"rgba(0,200,220,.13)", title:"Rankings & Automations", delay:0.2,
              icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8dc" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
              items:["Live trending & top-rated rankings","Fastest-growing tools over 30 days","Buy automations with escrow protection","Creators install workflows on your machine"] }
          ].map(({ bg, title, delay, icon, items }) => (
            <RevealSection key={title} delay={delay}>
              <TiltCard style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"28px", height:"100%" }}>
                <div className="float3d-1" style={{ width:"46px", height:"46px", borderRadius:"13px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"18px", background:bg }}>{icon}</div>
                <h3 style={{ fontSize:"16px", fontWeight:700, marginBottom:"16px" }}>{title}</h3>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"10px", padding:0, margin:0 }}>
                  {items.map(item => (
                    <li key={item} style={{ fontSize:"13px", color:"rgba(255,255,255,0.58)", display:"flex", alignItems:"flex-start", gap:"9px", lineHeight:1.4 }}>
                      <span style={{ color:"rgba(0,200,220,.8)", flexShrink:0 }}>▸</span>{item}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          LATEST ARTICLES
      ══════════════════════════════ */}
      <section style={{ padding:"64px 60px" }}>
        <RevealSection>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Explore TheAiStack</span>
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"30px" }}>
            {filterTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding:"7px 16px", borderRadius:"20px", fontSize:"13px", cursor:"pointer", transition:"all .2s",
                border:`1px solid ${activeTab===tab ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                background: activeTab===tab ? "rgba(0,212,255,0.12)" : "transparent",
                color: activeTab===tab ? "#00d4ff" : "rgba(255,255,255,0.6)", fontFamily:"inherit"
              }}>{tab}</button>
            ))}
          </div>
        </RevealSection>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"18px", marginBottom:"34px" }}>
          {platformExploreCards.map(({ img, badge, bc, bco, title, desc, date }, i) => (
            <RevealSection key={title} delay={i * 0.06}>
              <TiltCard style={{ display:"flex", gap:"16px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden", padding:"16px", cursor:"pointer", transition:"border-color .3s,box-shadow .3s" }}>
                <div style={{ width:"124px", height:"96px", borderRadius:"11px", overflow:"hidden", flexShrink:0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={badge} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.65) saturate(1.1)", transition:"transform .45s,filter .45s" }}
                    onMouseEnter={e => { const el=e.currentTarget as HTMLImageElement; el.style.transform="scale(1.08)"; el.style.filter="brightness(.8) saturate(1.3)"; }}
                    onMouseLeave={e => { const el=e.currentTarget as HTMLImageElement; el.style.transform=""; el.style.filter="brightness(.65) saturate(1.1)"; }}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"20px", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", marginBottom:"6px", background:bc, color:bco }}>{badge}</span>
                  <h4 style={{ fontSize:"13.5px", fontWeight:700, lineHeight:1.4, marginBottom:"5px", marginTop:"2px" }}>{title}</h4>
                  <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.46)", lineHeight:1.55, marginBottom:"10px" }}>{desc}</p>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.34)" }}>{date}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"11px", color:"rgba(255,255,255,0.46)" }}>
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"linear-gradient(135deg,#7c5cff,#00d4ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", fontWeight:700 }}>TA</div>
                      TheAiStack
                    </div>
                  </div>
                </div>
              </TiltCard>
            </RevealSection>
          ))}
        </div>
        <div style={{ textAlign:"center" }}>
          <Link href="/rankings" style={{ display:"inline-block", padding:"13px 32px", background:"transparent", border:"1px solid rgba(255,255,255,0.18)", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:500, textDecoration:"none", transition:"background .2s,border-color .2s,transform .2s" }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.08)"; el.style.borderColor="rgba(255,255,255,0.3)"; el.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="transparent"; el.style.borderColor="rgba(255,255,255,0.18)"; el.style.transform=""; }}
          >View live rankings →</Link>
        </div>
      </section>

      {/* ══════════════════════════════
          HOW AI SYSTEMS WORK
      ══════════════════════════════ */}
      <section style={{ padding:"70px 60px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"grid", gridTemplateColumns:"300px 1fr", gap:"60px", alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div aria-hidden style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />
        <RevealSection style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-block", padding:"4px 12px", background:"rgba(100,120,255,.15)", border:"1px solid rgba(100,120,255,.3)", borderRadius:"20px", fontSize:"11px", fontWeight:700, color:"#6496ff", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"16px" }}>How It Works</div>
          <h2 style={{ fontSize:"24px", fontWeight:900, letterSpacing:"-.3px", color:"#fff", lineHeight:1.35, marginBottom:"14px" }}>YOUR PATH FROM<br />DISCOVERY TO DEPLOYMENT</h2>
          <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.5)", lineHeight:1.8, marginBottom:"26px" }}>TheAiStack guides you through every step — pick a course or tool, learn with proof, and ship with confidence.</p>
          <Link href="/directory" style={{ display:"inline-flex", alignItems:"center", gap:"7px", padding:"12px 22px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:"10px", color:"#fff", fontSize:"13px", fontWeight:500, textDecoration:"none", transition:"background .2s,transform .2s" }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.12)"; el.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.background="rgba(255,255,255,0.06)"; el.style.transform=""; }}
          >Start exploring →</Link>
        </RevealSection>
        <RevealSection delay={0.1} style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"32px 24px" }}>
            {[
              { color:"rgba(90,70,255,.22)", border:"rgba(100,80,255,.4)", label:"Discover", desc:"Browse courses & tools", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8878ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg> },
              { color:"rgba(0,180,200,.2)", border:"rgba(0,190,210,.38)", label:"Compare", desc:"Reviews, ratings & proof", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h10M4 18h7"/><rect x="2" y="3" width="20" height="18" rx="2"/></svg> },
              { color:"rgba(160,60,255,.22)", border:"rgba(170,70,255,.4)", label:"Learn", desc:"Video lessons & progress", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c060ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg> },
              { color:"rgba(210,40,220,.2)", border:"rgba(220,50,230,.38)", label:"Automate", desc:"Buy & deploy workflows", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d040e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
              { color:"rgba(255,130,30,.2)", border:"rgba(255,140,40,.38)", label:"Ship", desc:"Certificates & results", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff9030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/><circle cx="12" cy="12" r="10"/></svg> }
            ].map(({ color, border, label, desc, icon }, i, arr) => (
              <div key={label} style={{ display:"flex", alignItems:"center", flex:1 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", flex:1 }}>
                  <div className="float3d-1" style={{ width:"56px", height:"56px", borderRadius:"15px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"12px", background:color, border:`1px solid ${border}`, transition:"transform .3s,box-shadow .3s", cursor:"default" }}
                    onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform="scale(1.15) translateY(-4px)"; el.style.boxShadow=`0 14px 30px ${color}`; }}
                    onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform=""; el.style.boxShadow=""; }}
                  >{icon}</div>
                  <h5 style={{ fontSize:"12px", fontWeight:700, marginBottom:"4px", color:"#fff" }}>{label}</h5>
                  <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.42)", lineHeight:1.4, maxWidth:"80px", margin:0 }}>{desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flexShrink:0, width:"40px", marginBottom:"34px" }}>
                    <svg viewBox="0 0 40 12" fill="none" style={{ width:"100%", height:"12px" }}>
                      <line x1="0" y1="6" x2="30" y2="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3"/>
                      <polyline points="26,2 34,6 26,10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ══════════════════════════════
          BUILDER RESOURCES
      ══════════════════════════════ */}
      <section style={{ padding:"64px 60px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <RevealSection>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"30px" }}>
            <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Platform Resources</span>
            <Link href="/pricing" style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)", textDecoration:"none" }}>View plans →</Link>
          </div>
        </RevealSection>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"18px" }}>
          {[
            { bg:"rgba(255,100,50,.14)", co:"#ff6432", title:"AI Tool Directory", desc:"Search, filter, and compare 4,000+ verified AI tools with buyer reviews and trust scores.", href:"/directory", delay:0, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6432" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { bg:"rgba(0,200,100,.14)", co:"#00c864", title:"Automation Marketplace", desc:"Buy ready-to-deploy automations with workflow files and hands-on creator setup.", href:"/automations", delay:0.06, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c864" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/></svg> },
            { bg:"rgba(60,100,255,.14)", co:"#5a78ff", title:"Course Academy", desc:"Structured video courses with workbooks, progress tracking, and verified certificates.", href:"/courses", delay:0.12, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a78ff" strokeWidth="1.8" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg> },
            { bg:"rgba(255,180,50,.14)", co:"#ffb432", title:"Live Rankings Board", desc:"Track trending, top-rated, and fastest-growing AI tools updated in real time.", href:"/rankings", delay:0.18, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffb432" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { bg:"rgba(140,80,255,.14)", co:"#8c50ff", title:"Create & Sell Courses", desc:"Any user can create courses, set pricing, and earn through Stripe with platform payouts.", href:"/courses", delay:0.24, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8c50ff" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
            { bg:"rgba(200,200,200,.07)", co:"rgba(255,255,255,.6)", title:"Premium Membership", desc:"Unlock every course, full directory access, and priority listing with one plan.", href:"/pricing", delay:0.30, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
          ].map(({ bg, co, title, desc, href, delay, icon }) => (
            <RevealSection key={title} delay={delay}>
              <TiltCard>
                <Link href={href} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"24px", cursor:"pointer", transition:"border-color .3s,box-shadow .3s", textDecoration:"none", color:"inherit", display:"block", height:"100%" }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor="rgba(255,255,255,0.18)"; el.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor="rgba(255,255,255,0.07)"; el.style.boxShadow=""; }}
                >
                  <div style={{ width:"46px", height:"46px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px", background:bg }}>{icon}</div>
                  <h4 style={{ fontSize:"14px", fontWeight:700, marginBottom:"7px" }}>{title}</h4>
                  <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.48)", lineHeight:1.6, marginBottom:"18px" }}>{desc}</p>
                  <span style={{ fontSize:"12px", color:co }}>Explore →</span>
                </Link>
              </TiltCard>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          NEWSLETTER
      ══════════════════════════════ */}
      <RevealSection style={{ margin:"0 60px 70px", position:"relative" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(76,38,196,.5),rgba(38,18,120,.44))", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"24px", padding:"48px 52px", display:"grid", gridTemplateColumns:"1fr auto", gap:"40px", alignItems:"center", overflow:"hidden", position:"relative" }}>
          {/* 3D glow orb */}
          <div aria-hidden className="aurora-blob-1" style={{ position:"absolute", top:"-80px", right:"260px", width:"320px", height:"320px", borderRadius:"50%", background:"rgba(100,60,255,.2)", filter:"blur(70px)", pointerEvents:"none" }} />
          <div aria-hidden className="aurora-blob-2" style={{ position:"absolute", bottom:"-60px", left:"40%", width:"240px", height:"240px", borderRadius:"50%", background:"rgba(0,180,255,.15)", filter:"blur(60px)", pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <div style={{ width:"48px", height:"48px", background:"rgba(255,255,255,0.12)", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"18px", fontSize:"24px" }}>🎓</div>
            <h2 style={{ fontSize:"24px", fontWeight:800, marginBottom:"9px", letterSpacing:"-.3px" }}>Unlock Every Course on TheAiStack</h2>
            <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.56)", lineHeight:1.65 }}>Enroll in multiple courses, download certificates, and get full directory access with one membership plan.</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px", minWidth:"330px" }}>
            <div style={{ display:"flex", gap:"10px" }}>
              <Link href="/pricing" style={{ flex:1, padding:"13px 16px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"10px", color:"rgba(255,255,255,0.7)", fontSize:"13px", textDecoration:"none", display:"flex", alignItems:"center", transition:"border-color .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(0,212,255,0.5)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="rgba(255,255,255,0.2)"; }}
              >View membership plans</Link>
              <Link href="/courses" style={{ padding:"13px 22px", background:"linear-gradient(135deg,#7c5cff,#00d4ff)", border:"none", borderRadius:"10px", color:"#fff", fontSize:"13px", fontWeight:700, textDecoration:"none", whiteSpace:"nowrap", boxShadow:"0 6px 24px rgba(100,80,255,.45)", transition:"transform .2s,box-shadow .2s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 10px 32px rgba(120,100,255,.6)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.transform=""; el.style.boxShadow="0 6px 24px rgba(100,80,255,.45)"; }}
              >Browse courses</Link>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"12px", color:"rgba(255,255,255,0.52)" }}>
              <div style={{ display:"flex" }}>
                {["11","22","33","44"].map((n,i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} src={`https://i.pravatar.cc/48?img=${n}`} alt="" style={{ width:"28px", height:"28px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.16)", marginLeft:i===0?0:"-9px", objectFit:"cover" }} />
                ))}
              </div>
              Join {data.stats.memberCount.toLocaleString()}+ learners on TheAiStack
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════
          TRUSTED BY + TESTIMONIALS
      ══════════════════════════════ */}
      <section style={{ padding:"64px 60px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"80px" }}>
        <RevealSection>
          <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:"30px" }}>Trusted by Learners &amp; Founders</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"20px 30px", alignItems:"center", marginBottom:"38px" }}>
            {["Courses","Directory","Rankings","Automations","Certificates","Marketplace"].map(name => (
              <span key={name} style={{ fontSize:"13px", fontWeight:800, color:"rgba(255,255,255,0.38)", letterSpacing:"1px", cursor:"pointer", transition:"color .25s,text-shadow .25s" }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLSpanElement; el.style.color="rgba(255,255,255,0.88)"; el.style.textShadow="0 0 20px rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLSpanElement; el.style.color="rgba(255,255,255,0.38)"; el.style.textShadow=""; }}
              >{name}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
            {[
              { val:`${data.stats.memberCount.toLocaleString()}+`, lbl:"Active learners" },
              { val:`${data.stats.toolCount.toLocaleString()}+`, lbl:"AI tools indexed" },
              { val:`${data.stats.courseCount}+`, lbl:"Courses available" }
            ].map(({ val, lbl }) => (
              <TiltCard key={lbl} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", padding:"16px 22px" }}>
                <div style={{ fontSize:"22px", fontWeight:900, color:"#fff", marginBottom:"3px" }}>{val}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.42)" }}>{lbl}</div>
              </TiltCard>
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={0.1}>
          <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:"22px" }}>What Members Say</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {[
              { q:"TheAiStack helped me pick the right AI tools with real buyer reviews — and the courses got me up to speed fast.", name:"Alex R.", role:"Founder @ Synthflow", init:"AR", grad:"linear-gradient(135deg,#7c5cff,#00d4ff)" },
              { q:"I bought an automation through the marketplace and the creator set it up on my machine. Escrow made the whole process feel safe.", name:"Maya K.", role:"Product Manager @ Scale AI", init:"MK", grad:"linear-gradient(135deg,#00c6ff,#0072ff)" }
            ].map(({ q, name, role, init, grad }) => (
              <TiltCard key={name} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"24px", transition:"border-color .3s" }}>
                <div style={{ fontSize:"20px", color:"rgba(0,212,255,0.5)", marginBottom:"12px", lineHeight:1 }}>&ldquo;</div>
                <blockquote style={{ fontSize:"14px", lineHeight:1.75, color:"rgba(255,255,255,0.8)", fontStyle:"italic", margin:"0 0 18px" }}>{q}</blockquote>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:700, flexShrink:0 }}>{init}</div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:700 }}>{name}</div>
                    <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.42)" }}>{role}</div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </RevealSection>
      </section>

    </div>
  );
}
