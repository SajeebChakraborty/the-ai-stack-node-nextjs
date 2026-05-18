import type { Tool } from "@/types/domain";

export type DirectoryFilters = {
  categories: Array<{ slug: string; name: string }>;
  pricingModels: string[];
};

export type DirectoryTool = Tool & { founderId?: string | null };

export type DirectoryListResponse = {
  tools: DirectoryTool[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  pendingClaimToolIds: string[];
};

export type DirectoryFiltersResponse = {
  filters: DirectoryFilters;
};
