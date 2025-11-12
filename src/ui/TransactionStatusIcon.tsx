import { ArrowDown, ArrowUp, RefreshCw, XCircle, CheckCircle, Edit } from "lucide-react";

export type TransactionStatus = 
  | "sent" 
  | "failed" 
  | "pending" 
  | "received" 
  | "scheduled"
  | "created"      // NEW: Just created, needs signature
  | "signed"       // NEW: Signed by user
  | "processing";  // NEW: Currently processing

interface TransactionStatusIconProps {
  status: TransactionStatus;
}

const BASE_CONTAINER =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black/10";

const STATUS_STYLES: Record<TransactionStatus, { container: string; icon: string }> = {
  sent: {
    container: "bg-[#183e26]",
    icon: "text-[#00e476]",
  },
  failed: {
    container: "bg-[#481818]",
    icon: "text-[#ef4444]",
  },
  pending: {
    container: "bg-[#734c09]",
    icon: "text-[#fe9902]",
  },
  received: {
    container: "bg-[#1d2f48]",
    icon: "text-[#439eef]",
  },
  scheduled: {
    container: "bg-[#581c87]",
    icon: "text-[#a855f7]",
  },
  created: {
    container: "bg-[#1d2f48]",
    icon: "text-[#439eef]",
  },
  signed: {
    container: "bg-[#183e26]",
    icon: "text-[#22c55e]",
  },
  processing: {
    container: "bg-[#734c09]",
    icon: "text-[#fb923c]",
  },
};

export function TransactionStatusIcon({ status }: TransactionStatusIconProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.sent;

  // Get icon component based on status
  const getIcon = () => {
    switch (status) {
      case "created":
        return <Edit className={`h-5 w-5 ${styles.icon}`} />; // Edit/pen icon for created
      case "signed":
        return <CheckCircle className={`h-5 w-5 ${styles.icon}`} />; // Checkmark for signed
      case "scheduled":
        return <ArrowUp className={`h-5 w-5 ${styles.icon}`} />; // Arrow up for scheduled
      case "processing":
        return <RefreshCw className={`h-5 w-5 ${styles.icon}`} />; // Spinning for processing
      case "pending":
        return <RefreshCw className={`h-5 w-5 ${styles.icon}`} />; // Spinning for pending
      case "sent":
        return <ArrowDown className={`h-5 w-5 ${styles.icon} -rotate-[135deg]`} />; // Arrow for sent
      case "received":
        return <ArrowDown className={`h-5 w-5 ${styles.icon} -rotate-[45deg]`} />; // Arrow pointing down for received
      case "failed":
        return <XCircle className={`h-5 w-5 ${styles.icon}`} />; // X icon for failed
      default:
        return <ArrowDown className={`h-5 w-5 ${styles.icon} -rotate-180`} />;
    }
  };

  return (
    <div className={`${BASE_CONTAINER} ${styles.container}`}>
      {getIcon()}
    </div>
  );
}

