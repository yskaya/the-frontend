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

export function TransactionStatusIcon({ status }: TransactionStatusIconProps) {
  // Get icon class based on status
  const getIconClass = () => {
    switch (status) {
      case "created":
        return "transaction-icon-created"; // Blue
      case "signed":
        return "transaction-icon-signed"; // Green
      case "scheduled":
        return "transaction-icon-scheduled"; // Purple
      case "processing":
        return "transaction-icon-processing"; // Orange
      case "pending":
        return "transaction-icon-pending"; // Orange
      case "sent":
        return "transaction-icon-sent"; // Green
      case "received":
        return "transaction-icon-received"; // Blue
      case "failed":
        return "transaction-icon-failed"; // Red
      default:
        return "transaction-icon-sent";
    }
  };

  // Get icon component based on status
  const getIcon = () => {
    switch (status) {
      case "created":
        return <Edit className="h-5 w-5 text-white" />; // Edit/pen icon for created
      case "signed":
        return <CheckCircle className="h-5 w-5 text-white" />; // Checkmark for signed
      case "scheduled":
        return <ArrowUp className="h-5 w-5 text-white" />; // Arrow up for scheduled
      case "processing":
        return <RefreshCw className="h-5 w-5 text-white" />; // Spinning for processing
      case "pending":
        return <RefreshCw className="h-5 w-5 text-white" />; // Spinning for pending
      case "sent":
        return <ArrowDown className="h-5 w-5 text-white" style={{ transform: 'rotate(-135deg)' }} />; // Arrow for sent
      case "received":
        return <ArrowDown className="h-5 w-5 text-white" style={{ transform: 'rotate(-45deg)' }} />; // Arrow pointing down for received
      case "failed":
        return <XCircle className="h-5 w-5 text-white" />; // X icon for failed
      default:
        return <ArrowDown className="h-5 w-5 text-white" style={{ transform: 'rotate(-180deg)' }} />;
    }
  };

  return (
    <div className={`transaction-icon-container ${getIconClass()}`}>
      {getIcon()}
    </div>
  );
}

