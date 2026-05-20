import { premiumPlans, reviews, tools } from "@/data/catalog";
import { HOME_AI_VIDEOS } from "@/lib/content/home-videos";
import { sortTools } from "@/lib/utils/ranking";
import type { CourseListItem } from "@/types/course";
import type { DirectoryTool } from "@/types/directory";
import type { PremiumPlan } from "@/types/domain";

export type HomePageData = {
  stats: { toolCount: number; courseCount: number; memberCount: number };
  spotlightCourse: CourseListItem | null;
  featuredCourses: CourseListItem[];
  trendingTools: DirectoryTool[];
  recentReviews: Array<{
    id: string;
    rating: number;
    title: string;
    body: string;
    toolName: string;
    toolSlug: string;
    authorName: string;
  }>;
  plans: PremiumPlan[];
};

const staticCourses: CourseListItem[] = [
  {
    id: "c1",
    slug: "ai-website-builder-crash-course",
    title: "AI Website Builder Crash Course",
    shortDescription: "Build and launch a real website using AI tools without writing code.",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[0],
    level: "beginner",
    durationMinutes: 33,
    durationLabel: "33 min",
    lessonCount: 5,
    rating: 4.8,
    reviewCount: 4,
    instructorName: "Saj Adib",
    categories: ["No-Code", "AI Fundamentals"],
    featured: true,
    releasedLabel: "December 2025"
  },
  {
    id: "c2",
    slug: "ultimate-guide-to-generative-ai",
    title: "The Ultimate Guide to Generative AI",
    shortDescription: "Create content, visuals, and video with ChatGPT, Gemini, Midjourney, and more.",
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[1],
    level: "beginner",
    durationMinutes: 180,
    durationLabel: "3 hr",
    lessonCount: 67,
    rating: 4.9,
    reviewCount: 32,
    instructorName: "Saj Adib",
    categories: ["Generative AI"],
    featured: true,
    releasedLabel: "November 2025"
  },
  {
    id: "c3",
    slug: "ai-powered-digital-marketing",
    title: "AI-Powered Digital Marketing",
    shortDescription: "Use generative AI to grow your business without technical skills.",
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[2],
    level: "intermediate",
    durationMinutes: 95,
    durationLabel: "1.5 hr",
    lessonCount: 25,
    rating: 5.0,
    reviewCount: 11,
    instructorName: "Saj Adib",
    categories: ["Marketing"],
    featured: false,
    releasedLabel: "October 2025"
  },
  {
    id: "c4",
    slug: "prompting-essentials",
    title: "Prompting Essentials: Use ChatGPT Like a Pro",
    shortDescription: "Master prompt strategies and real-world applications from the ground up.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[3],
    level: "beginner",
    durationMinutes: 120,
    durationLabel: "2 hr",
    lessonCount: 20,
    rating: 5.0,
    reviewCount: 30,
    instructorName: "Saj Adib",
    categories: ["Prompting"],
    featured: false,
    releasedLabel: "September 2025"
  },
  {
    id: "c5",
    slug: "14-day-ai-boot-camp",
    title: "14-Day AI Boot Camp",
    shortDescription: "Essentials of generative AI including ChatGPT, Gemini, and Midjourney.",
    thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[4],
    level: "beginner",
    durationMinutes: 210,
    durationLabel: "3.5 hr",
    lessonCount: 17,
    rating: 4.9,
    reviewCount: 220,
    instructorName: "Saj Adib",
    categories: ["AI Fundamentals"],
    featured: false,
    releasedLabel: "August 2025"
  },
  {
    id: "c6",
    slug: "custom-gpts-for-entrepreneurs",
    title: "Custom GPTs For Entrepreneurs",
    shortDescription: "Build personalized ChatGPT assistants tailored to your business.",
    thumbnailUrl: "https://images.unsplash.com/photo-1535378620167-273858593413?auto=format&fit=crop&w=1920&q=90",
    promoVideoUrl: HOME_AI_VIDEOS.courses[5],
    level: "intermediate",
    durationMinutes: 140,
    durationLabel: "2.5 hr",
    lessonCount: 23,
    rating: 4.9,
    reviewCount: 17,
    instructorName: "Saj Adib",
    categories: ["Agents"],
    featured: false,
    releasedLabel: "July 2025"
  }
];

function mapReviews() {
  const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t.name]));

  return reviews.slice(0, 6).map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    toolName: toolBySlug[review.toolSlug] ?? review.toolSlug,
    toolSlug: review.toolSlug,
    authorName: review.author
  }));
}

function mapTrendingTools(): DirectoryTool[] {
  return sortTools(tools, "trending").slice(0, 6).map((tool) => ({
    ...tool,
    promoVideoUrl: HOME_AI_VIDEOS.toolsBySlug[tool.slug] ?? HOME_AI_VIDEOS.hero,
    videos: tool.videos.map((video, index) =>
      index === 0
        ? {
            ...video,
            embedUrl: HOME_AI_VIDEOS.toolsBySlug[tool.slug] ?? HOME_AI_VIDEOS.hero
          }
        : video
    )
  }));
}

/** Static home page payload — no database calls. */
export function getStaticHomePageData(): HomePageData {
  const membershipPlan = premiumPlans.find((p) => p.id === "starter") ?? premiumPlans[1];

  return {
    stats: {
      toolCount: 4002,
      courseCount: 30,
      memberCount: 3000
    },
    spotlightCourse: {
      ...staticCourses[0]!,
      promoVideoUrl: HOME_AI_VIDEOS.hero
    },
    featuredCourses: staticCourses,
    trendingTools: mapTrendingTools(),
    recentReviews: mapReviews(),
    plans: membershipPlan ? [membershipPlan] : []
  };
}
