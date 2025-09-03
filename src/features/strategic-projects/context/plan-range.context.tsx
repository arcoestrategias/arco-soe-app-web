"use client";
import { createContext, useContext, PropsWithChildren } from "react";

type PlanRange = { planFromAt?: string | null; planUntilAt?: string | null };
const PlanRangeContext = createContext<PlanRange>({
  planFromAt: null,
  planUntilAt: null,
});

export function PlanRangeProvider({
  planFromAt,
  planUntilAt,
  children,
}: PropsWithChildren<PlanRange>) {
  return (
    <PlanRangeContext.Provider value={{ planFromAt, planUntilAt }}>
      {children}
    </PlanRangeContext.Provider>
  );
}

export const usePlanRange = () => useContext(PlanRangeContext);
