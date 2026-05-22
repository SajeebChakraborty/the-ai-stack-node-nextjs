"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, PlayCircle, Search, Star } from "lucide-react";
import type { CourseListItem } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RemoteImage } from "@/components/ui/remote-image";

type CategoryOption = { slug: string; name: string };

type CoursesInitialData = {
  courses: CourseListItem[];
  total: number;
  hasMore: boolean;
};

export function CoursesCatalogClient({
  initialQuery = "",
  initialCategories = [],
  initialData
}: {
  initialQuery?: string;
  initialCategories?: CategoryOption[];
  initialData?: CoursesInitialData;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [courses, setCourses] = useState<CourseListItem[]>(initialData?.courses ?? []);
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchRef = useRef<AbortController | null>(null);
  const skipInitialFetchRef = useRef(Boolean(initialData));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (initialCategories.length > 0) {
      return;
    }
    void fetch("/api/courses?filtersOnly=true")
      .then((response) => response.json())
      .then((payload: { categories?: CategoryOption[] }) => setCategories(payload.categories ?? []))
      .catch(() => undefined);
  }, [initialCategories.length]);

  const loadCourses = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      fetchRef.current?.abort();
      const controller = new AbortController();
      fetchRef.current = controller;

      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          pageSize: "12",
          category,
          level
        });
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }

        const response = await fetch(`/api/courses?${params.toString()}`, { signal: controller.signal });
        const payload = (await response.json()) as {
          courses?: CourseListItem[];
          total?: number;
          hasMore?: boolean;
          enrolledCourseIds?: string[];
        };

        setCourses((current) => (mode === "append" ? [...current, ...(payload.courses ?? [])] : payload.courses ?? []));
        setTotal(payload.total ?? 0);
        setHasMore(Boolean(payload.hasMore));
        setPage(targetPage);
        setEnrolledIds(new Set(payload.enrolledCourseIds ?? []));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (mode === "replace") {
          setCourses([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, debouncedQuery, level]
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    void loadCourses(1, "replace");
  }, [loadCourses]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <p className="flex items-center text-sm text-muted-foreground">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {total} course{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow">
            <div className="relative aspect-video bg-secondary">
              {course.thumbnailUrl ? (
                <RemoteImage
                  src={course.thumbnailUrl}
                  alt={course.title}
                  width={640}
                  height={360}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <PlayCircle className="h-10 w-10" />
                </div>
              )}
              {course.featured ? (
                <Badge className="absolute left-3 top-3" variant="premium">
                  Featured
                </Badge>
              ) : null}
              {enrolledIds.has(course.id) ? (
                <Badge className="absolute right-3 top-3" variant="verified">
                  Enrolled
                </Badge>
              ) : null}
              <Badge className="absolute right-3 bottom-3" variant={course.priceCents > 0 ? "premium" : "secondary"}>
                {course.priceCents > 0 ? `$${(course.priceCents / 100).toFixed(2)}` : "Free"}
              </Badge>
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                {course.categories.slice(0, 2).map((name) => (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                ))}
                {course.ownerId ? <Badge variant="outline">Creator-led</Badge> : null}
              </div>
              <h2 className="text-lg font-semibold leading-snug">
                <Link href={`/courses/${course.slug}`} className="hover:text-primary">
                  {course.title}
                </Link>
              </h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  {course.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.durationLabel}
                </span>
                <span>{course.lessonCount} lessons</span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href={`/courses/${course.slug}`}>
                  {course.priceCents > 0 ? `Buy for $${(course.priceCents / 100).toFixed(2)}` : "View course"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && courses.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">No courses match your filters yet.</div>
      ) : null}

      {hasMore ? (
        <Button variant="outline" className="mx-auto" disabled={loadingMore} onClick={() => void loadCourses(page + 1, "append")}>
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load more courses"
          )}
        </Button>
      ) : null}
    </div>
  );
}
