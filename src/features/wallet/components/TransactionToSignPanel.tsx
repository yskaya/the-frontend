import { FileSignature, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";

export function TransactionToSignPanel() {
  // Placeholder state - will be implemented in the future
  const hasPendingTransaction = false;
  const isLoading = false;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="h-5 w-5 text-white" />
        <h2 className="text-white text-xl font-semibold">Transaction to Sign</h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!hasPendingTransaction && !isLoading && (
        <div className="placeholder">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No pending transactions</p>
          <p className="text-gray-500 text-sm mt-1">Signing functionality coming soon</p>
        </div>
      )}

      {/* Placeholder for future implementation */}
      {hasPendingTransaction && (
        <div className="p-4 rounded-xl bg-white/10 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400 bg-orange-500/10">
              Pending Signature
            </Badge>
          </div>
          <p className="text-sm text-white mb-3">Transaction requires your signature</p>
          <div className="flex gap-2">
            <Button className="flex-1 bg-white text-black hover:bg-gray-100">
              Review & Sign
            </Button>
            <Button variant="outline" className="border-gray-400 text-gray-400 hover:bg-gray-800">
              Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

