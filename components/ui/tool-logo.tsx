import { cn } from "@/lib/utils/cn";
import { resolveToolLogoUrl } from "@/lib/utils/tool-logo";
import { RemoteImage } from "@/components/ui/remote-image";

type ToolLogoProps = {
  alt: string;
  className?: string;
  height: number;
  src?: string | null;
  width: number;
};

export function ToolLogo({ alt, className, height, src, width }: ToolLogoProps) {
  return <RemoteImage src={resolveToolLogoUrl(src)} alt={alt} width={width} height={height} className={cn(className)} />;
}
