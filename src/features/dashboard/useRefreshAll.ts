import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { queryClient } from "@/lib";
import { useWallet, useSyncTransactions } from "@/features/blockchain";

interface RefreshState<WalletType> {
  wallet: WalletType | undefined;
  walletLoading: boolean;
  isRefreshing: boolean;
  showPullIndicator: boolean;
  triggerRefresh: () => Promise<void>;
}

export function useRefreshAll(userId?: string): RefreshState<ReturnType<typeof useWallet>["data"]> {
  const { data: wallet, isLoading: walletLoading } = useWallet(userId);
  const syncTransactions = useSyncTransactions();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPullIndicator, setShowPullIndicator] = useState(false);
  const lastRefreshRef = useRef(0);
  const autoSyncedRef = useRef(false);
  const autoSyncKey = useMemo(() => wallet?.address ?? userId ?? "no-wallet", [wallet?.address, userId]);

  const refresh = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet", userId] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["payrolls"] }),
      queryClient.invalidateQueries({ queryKey: ["payroll-payments"] }),
    ]);

    try {
      if (syncTransactions.mutateAsync) {
        await syncTransactions.mutateAsync();
      } else {
        syncTransactions.mutate();
      }
    } catch (error) {
      console.error("[useRefreshAll] Sync transactions failed", error);
    }
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
    autoSyncedRef.current = false;
  }, [autoSyncKey]);

  useEffect(() => {
    if (!wallet || walletLoading || autoSyncedRef.current) {
      return;
    }

    autoSyncedRef.current = true;
    triggerRefresh().catch((error) => {
      console.error("[useRefreshAll] Auto trigger failed", error);
    });
  }, [wallet, walletLoading, triggerRefresh]);

  useEffect(() => {
    const startRefreshWithIndicator = () => {
      setShowPullIndicator(true);
      triggerRefresh().finally(() => {
        setTimeout(() => {
          setShowPullIndicator(false);
        }, 600);
      });
    };

    const handleWheel = (event: WheelEvent) => {
      if (window.scrollY <= 0 && event.deltaY < -35) {
        startRefreshWithIndicator();
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
        startRefreshWithIndicator();
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

  return {
    wallet,
    walletLoading,
    isRefreshing,
    showPullIndicator,
    triggerRefresh,
  };
}