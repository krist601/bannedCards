export type DirectorySet = { code: string; name: string; releasedAt: string | null; iconUrl: string | null; upcoming: boolean; setCodes: string[] };
export type SetPage = { sets: DirectorySet[]; offset: number; nextOffset: number | null; previousOffset: number | null; latestSetCodes: string[] };
export type CatalogueFilter = { kind: "all" | "latest" | "added" | "hottest" } | { kind: "set"; code: string; name: string; setCodes?: string[] };
