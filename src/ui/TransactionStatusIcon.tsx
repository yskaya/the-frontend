import { ArrowDown, ArrowUp, RefreshCw, XCircle } from "lucide-react";
import "../components.css";

export type TransactionStatus = "sent" | "failed" | "pending" | "received" | "scheduled";

interface TransactionStatusIconProps {
  status: TransactionStatus;
}

export function TransactionStatusIcon({ status }: TransactionStatusIconProps) {
  // Get icon class based on status
  const getIconClass = () => {
    switch (status) {
      case "pending":
        return "transaction-icon-pending";
      case "sent":
        return "transaction-icon-sent";
      case "received":
        return "transaction-icon-received";
      case "failed":
        return "transaction-icon-failed"; // Dark red background with bright red icon
      case "scheduled":
        return "transaction-icon-scheduled"; // Grey background with white arrow
      default:
        return "transaction-icon-sent";
    }
  };

  // Get icon component based on status
  const getIcon = () => {
    switch (status) {
      case "pending":
        return <RefreshCw className="h-5 w-5" />;
      case "sent":
        return <ArrowDown className="h-5 w-5" style={{ transform: 'rotate(-135deg)' }} />; // Same arrow as received, rotated 15 degrees
      case "received":
        return <ArrowDown className="h-5 w-5" style={{ transform: 'rotate(-45deg)' }} />; // Arrow pointing down for received
      case "failed":
        return <XCircle className="h-5 w-5" />; // X icon for failed
      case "scheduled":
        return <ArrowUp className="h-5 w-5" />; // Arrow pointing up for scheduled
      default:
        return <ArrowDown className="h-5 w-5" style={{ transform: 'rotate(-180deg)' }} />;
    }
  };

  return (
    <div className={`transaction-icon-container ${getIconClass()}`}>
      {getIcon()}
    </div>
  );
}

