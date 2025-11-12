"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TabKey = "txs" | "prls";

interface DashboardContextValue {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabKey>("txs");

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
    }),
    [activeTab],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

