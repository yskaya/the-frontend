interface NetworkPanelProps {
  networkName?: string;
  statusColor?: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export function NetworkPanel({ networkName = "Sepolia", statusColor = "green" }: NetworkPanelProps) {
  const dotColorClass = STATUS_COLOR_MAP[statusColor] ?? STATUS_COLOR_MAP.green;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <div className={`h-2 w-2 rounded-full ${dotColorClass}`} />
      <p className="text-xs font-medium text-white">
        {networkName}
      </p>
    </div>
  );
}

