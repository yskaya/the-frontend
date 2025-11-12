import { RefreshCw } from "lucide-react";

interface RefreshBannerProps {
  isVisible?: boolean;
}

export function RefreshBanner({ isVisible = false }: RefreshBannerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-gray-800 shadow-lg backdrop-blur">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">Refreshing…</span>
    </div>
  );
}

