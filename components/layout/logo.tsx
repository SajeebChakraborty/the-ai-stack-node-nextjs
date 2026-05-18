import Link from "next/link";
import { Layers3 } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-normal">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-glow">
        <Layers3 className="h-5 w-5" />
      </span>
      <span className="hidden text-base sm:inline">TheAiStack</span>
    </Link>
  );
}
