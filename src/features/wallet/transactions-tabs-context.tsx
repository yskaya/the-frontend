"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TransactionsTabKey = "transactions" | "payrolls";

interface TransactionsTabsContextValue {
  activeTab: TransactionsTabKey;
  setActiveTab: (tab: TransactionsTabKey) => void;
}

const TransactionsTabsContext = createContext<TransactionsTabsContextValue | null>(null);

export function TransactionsTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TransactionsTabKey>("transactions");

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
    }),
    [activeTab],
  );

  return (
    <TransactionsTabsContext.Provider value={value}>
      {children}
    </TransactionsTabsContext.Provider>
  );
}

export function useTransactionsTabs() {
  const context = useContext(TransactionsTabsContext);
  if (!context) {
    throw new Error("useTransactionsTabs must be used within a TransactionsTabsProvider");
  }
  return context;
}

