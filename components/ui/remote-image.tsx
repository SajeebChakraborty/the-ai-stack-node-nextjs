import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { canUseNextImage, isLikelyImageUrl } from "@/lib/utils/tool-logo";

type RemoteImageProps = {
  alt: string;
  className?: string;
  height: number;
  src?: string | null;
  width: number;
};

export function RemoteImage({ alt, className, height, src, width }: RemoteImageProps) {
  const trimmed = src?.trim();
  if (!trimmed || !isLikelyImageUrl(trimmed)) {
    return null;
  }

  if (canUseNextImage(trimmed)) {
    return <Image src={trimmed} alt={alt} width={width} height={height} className={cn(className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={trimmed} alt={alt} width={width} height={height} className={cn(className)} loading="lazy" decoding="async" />
  );
}
