import { useCallback, useEffect, useState } from "react";
import { queryClient } from "@/lib";
import { useSyncTransactions } from "@/features/blockchain";

export function useRefreshAll(userId?: string): boolean {
  const syncTransactions = useSyncTransactions();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await syncTransactions.mutateAsync();
    } catch (error) {
      console.error("[useRefreshAll] Sync transactions failed", error);
    }

    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ["wallet"], refetchType: "active" }),
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" }),
      queryClient.invalidateQueries({ queryKey: ["payrolls"] }),
      queryClient.invalidateQueries({ queryKey: ["payroll-payments"], refetchType: "active" }),
    ]);
  }, [syncTransactions, userId]);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refresh]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (window.scrollY <= 0 && event.deltaY < -35) {
        triggerRefresh().catch((error) => {
          console.error("[useRefreshAll] wheel refresh failed", error);
        });
      }
    };

    let touchStartY: number | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY <= 0) {
        touchStartY = event.touches[0].clientY;
      } else {
        touchStartY = null;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartY === null) {
        return;
      }

      const delta = event.touches[0].clientY - touchStartY;
      if (delta > 90) {
        touchStartY = null;
        triggerRefresh().catch((error) => {
          console.error("[useRefreshAll] touch refresh failed", error);
        });
      }
    };

    const handleTouchEnd = () => {
      touchStartY = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [triggerRefresh]);

  return isRefreshing;
}

