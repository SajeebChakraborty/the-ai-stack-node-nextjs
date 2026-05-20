export const homeValueProps = [
  {
    title: "Watch & learn",
    description: "HD lesson videos, workbooks, and progress tracking on every course.",
    accent: "from-rose-500/20 to-transparent"
  },
  {
    title: "Discover with proof",
    description: "4,000+ AI tools ranked by reviews, trust scores, and live momentum.",
    accent: "from-violet-500/20 to-transparent"
  },
  {
    title: "Earn certificates",
    description: "Finish courses and download verified PDF credentials with QR validation.",
    accent: "from-amber-500/20 to-transparent"
  }
] as const;

export const homeSteps = [
  { step: "01", title: "Pick a course or tool", text: "Browse academy courses or the AI directory." },
  { step: "02", title: "Learn with video", text: "Stream lessons and compare tools with real buyer proof." },
  { step: "03", title: "Ship with confidence", text: "Track progress, bookmark winners, and unlock certificates." }
] as const;
