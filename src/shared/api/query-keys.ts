export const QKEY = {
  companies: ["companies"] as const,
  logo: (id: string) => ["logo", id] as const,
  documents: (id: string) => ["documents", id] as const,

  businessUnits: ["business-units"] as const,
  buLogo: (id: string) => ["bu-logo", id] as const,
  buDocuments: (id: string) => ["bu-documents", id] as const,

  users: ["users"] as const,
  userAvatar: (id: string) => ["user-avatar", id] as const,

  roles: ["roles"] as const,

  userPermissions: (businessUnitId: string, userId: string) =>
    ["user-permissions", businessUnitId, userId] as const,
};
