'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { TransactionsHistory } from "@/features/transactions";
import { PayrollsHistory } from "@/features/payrolls";

type PanelKey = "transactions" | "payrolls";

interface DashboardHistoryProps {
  initialActive?: PanelKey;
  className?: string;
}

export function DashboardHistory({
  initialActive = "transactions",
  className,
}: DashboardHistoryProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>(initialActive);
  const [queuedPanel, setQueuedPanel] = useState<PanelKey | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const panelRefs = useRef<Record<PanelKey, HTMLDivElement | null>>({
    transactions: null,
    payrolls: null,
  });
  const [panelHeights, setPanelHeights] = useState<Record<PanelKey, number>>({
    transactions: 0,
    payrolls: 0,
  });
  const panels: Array<{
    key: PanelKey;
    title: string;
    render: (className: string) => ReactNode;
  }> = [
    {
      key: "transactions",
      title: "Transactions",
      render: (className) => (
        <TransactionsHistory className={className} />
      ),
    },
    {
      key: "payrolls",
      title: "Payrolls",
      render: (className) => (
        <PayrollsHistory className={className} />
      ),
    },
  ];

  const handleActivate = useCallback(
    (panel: PanelKey) => {
      if (panel === activePanel || panel === queuedPanel) return;

      setQueuedPanel(panel);

      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setActivePanel(panel);
        setQueuedPanel(null);
      }, 260);
    },
    [activePanel, queuedPanel]
  );

  const handleKeyActivate = useCallback((panel: PanelKey, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate(panel);
    }
  }, [handleActivate]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ResizeObserver) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const key = (entry.target as HTMLElement).dataset.panelKey as PanelKey | undefined;
        if (!key) return;
        const { height } = entry.contentRect;
        setPanelHeights((prev) => {
          if (prev[key] === height) return prev;
          return { ...prev, [key]: height };
        });
      });
    });

    Object.entries(panelRefs.current).forEach(([, node]) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activePanel, queuedPanel]);

  const PREVIEW_HEIGHT = 100;
  const activePanelHeight = panelHeights[activePanel] ?? 0;
  const queuedPanelHeight = queuedPanel ? panelHeights[queuedPanel] ?? 0 : 0;
  const maxPanelHeight = Math.max(activePanelHeight, queuedPanelHeight);
  const containerHeight =
    maxPanelHeight > 0 ? maxPanelHeight + 76 : PREVIEW_HEIGHT + 76;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ marginTop: -35, minHeight: containerHeight }}
    >
      {panels.map(({ key, title, render }) => {
        const isActive = activePanel === key;
        const isQueued = queuedPanel === key;
        const isTransitioningOut =
          queuedPanel !== null && activePanel === key && queuedPanel !== key;
        const displayAsActive = isActive || isQueued;

        const visualClass = cn(
          "w-full transition-transform duration-500",
          displayAsActive && !isTransitioningOut
          ? "scale-100 shadow-[0_40px_120px_rgba(16,0,32,0.45)] z-30"
          : "scale-[0.7] z-20",
          {
            "cursor-pointer": !displayAsActive,
          }
        );

        const panelHeight = panelHeights[key] ?? 0;
        const topPosition = isActive ? 70 : 0;
        const overflowMode = displayAsActive ? "visible" : "hidden";
        const heightStyle =
          !displayAsActive ? PREVIEW_HEIGHT : panelHeight || undefined;

        const panelClassName = cn(
          "max-w-[700px] w-full mx-auto flex flex-col",
          displayAsActive ? "gap-8" : "gap-4"
        );

        return (
          <div
            key={key}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[1200px] will-change-transform",
              visualClass
            )}
            onClick={
              !displayAsActive
                ? () => {
                    handleActivate(key);
                  }
                : undefined
            }
            onKeyDown={
              !displayAsActive
                ? (event) => {
                    handleKeyActivate(key, event);
                  }
                : undefined
            }
            role={!displayAsActive ? "button" : undefined}
            tabIndex={!displayAsActive ? 0 : undefined}
            aria-expanded={displayAsActive}
            aria-label={`${title}${
              displayAsActive ? " panel open" : " panel preview"
            }`}
            style={{
              top: topPosition,
              height: heightStyle,
              overflow: overflowMode,
            }}
          >
            <div
              className={cn(
                "relative flex flex-col border border-white/10 transition-all duration-500",
                displayAsActive
                  ? "pointer-events-auto bg-[rgba(31,0,55,0.95)] rounded-[48px] px-6 sm:px-8 pt-[60px] pb-8 sm:pb-10 gap-5"
                  : "pointer-events-none bg-[#0a0018] rounded-t-[48px] rounded-b-none px-6 sm:px-8 pt-6 pb-4 gap-4"
              )}
              data-panel-key={key}
              ref={(node) => {
                panelRefs.current[key] = node;
              }}
            >
              <div className="flex w-full flex-col text-left">
                {render(panelClassName)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


