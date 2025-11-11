"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TabKey = "transactions" | "payrolls";

interface DashboardHistoryContextValue {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const DashboardHistoryContext = createContext<DashboardHistoryContextValue | null>(null);

export function DashboardHistoryProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
    }),
    [activeTab],
  );

  return (
    <DashboardHistoryContext.Provider value={value}>
      {children}
    </DashboardHistoryContext.Provider>
  );
}

export function useDashboardHistory() {
  const context = useContext(DashboardHistoryContext);
  if (!context) {
    throw new Error("useDashboardHistory must be used within a DashboardHistoryProvider");
  }
  return context;
}

