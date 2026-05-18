import { layout } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  id?: string;
};

export function Section({ children, className, compact, id }: SectionProps) {
  return (
    <section id={id} className={cn(compact ? layout.sectionCompact : layout.section, className)}>
      {children}
    </section>
  );
}

export function SectionShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("container", className)}>{children}</div>;
}
