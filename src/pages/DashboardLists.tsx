'use client';

import { type ComponentType, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TransactionsActivity } from "@/features/blockchain";
import { PayrollsActivity } from "@/features/payrolls";
import { useDashboardContext, type TabKey } from "./DashboardProvider";

export function DashboardLists() {
  const { activeTab, setActiveTab } = useDashboardContext();
  const activePanelRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>();

  useEffect(() => {
    if (!activePanelRef.current) return;

    const { height } = activePanelRef.current.getBoundingClientRect();
    setContainerHeight(height);
  }, []);

  const panels: Array<{ key: TabKey; Component: ComponentType }> = [
    {
      key: "txs",
      Component: TransactionsActivity,
    },
    {
      key: "prls",
      Component: PayrollsActivity,
    },
  ];

  return (
    <div
      className="relative"
      style={containerHeight ? { height: containerHeight } : undefined}
    >
      {panels.map(({ key, Component }) => (
        <div
          key={key}
          ref={(node) => {
            if (activeTab === key) {
              activePanelRef.current = node;
            }
          }}
          onClick={() => setActiveTab(key)}
          className={cn(
            "absolute w-full flex flex-col origin-top rounded-[48px] py-16 px-6 sm:px-8 border border-white/10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activeTab === key
              ? "top-[0px] z-30 scale-100 bg-[rgba(31,0,55,0.95)]"
              : "top-[-55px] z-20 scale-[0.7] max-h-screen py-6 cursor-pointer bg-[#0a0018]"
          )}
        >
          <div className="w-full max-w-[700px] mx-auto">
            <Component /> 
          </div>
        </div>
      ))}
    </div>
  );
}


