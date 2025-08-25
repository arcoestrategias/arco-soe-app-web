import { useAuth } from "../context/AuthContext";

export function useMe() {
  const { me, permissions, businessUnits, needsSelection, loading, reloadMe } =
    useAuth();
  return {
    me,
    permissions,
    businessUnits,
    needsSelection,
    loading,
    reload: reloadMe,
  };
}
