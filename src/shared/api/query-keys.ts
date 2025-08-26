export const QKEY = {
  companies: ["companies"] as const,
  logo: (id: string) => ["logo", id] as const,
  documents: (id: string) => ["documents", id] as const,
};
