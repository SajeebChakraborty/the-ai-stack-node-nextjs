import "server-only";

import { getDirectoryTools } from "@/lib/queries/directory";
import { sortTools } from "@/lib/utils/ranking";
import type { Tool } from "@/types/domain";

export type RankingsBoard = {
  fastestGrowing: Tool[];
  topRated: Tool[];
  trending: Tool[];
};

export async function getRankingsBoard(limit = 6): Promise<RankingsBoard> {
  const publishedTools = await getDirectoryTools();

  return {
    trending: sortTools(publishedTools, "trending").slice(0, limit),
    topRated: sortTools(publishedTools, "top-rated").slice(0, limit),
    fastestGrowing: sortTools(publishedTools, "fastest-growing").slice(0, limit)
  };
}
