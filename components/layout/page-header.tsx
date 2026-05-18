import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  variant?: "marketing" | "academy" | "default";
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  className,
  variant = "default",
  children
}: PageHeaderProps) {
  const titleClass =
    variant === "marketing"
      ? typography.display
      : variant === "academy"
        ? cn(typography.h1, "font-display")
        : typography.h1;

  return (
    <header className={cn("space-y-4", className)}>
      {eyebrow ? <p className={typography.eyebrow}>{eyebrow}</p> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <h1 className={titleClass}>{title}</h1>
          {description ? <p className={typography.lead}>{description}</p> : null}
        </div>
        {actionHref && actionLabel ? (
          <Button asChild variant="outline" className="shrink-0">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
      {children}
    </header>
  );
}
