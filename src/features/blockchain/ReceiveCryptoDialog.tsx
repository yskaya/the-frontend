import { Copy, QrCode, X } from "lucide-react";
import { Button } from "@/ui/button";
import { Separator } from "@/ui/separator";
import { Sheet, SheetContent } from "@/ui/sheet";
import { toast } from "sonner";

interface ReceiveCryptoDialogProps {
  walletAddress: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveCryptoDialog({ walletAddress, isOpen, onOpenChange }: ReceiveCryptoDialogProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied to clipboard");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
      >
        <div className="h-full bg-white overflow-y-auto p-6">
          <div className="space-y-6 text-black">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Receive Crypto
                </h2>
                <p className="text-sm text-gray-600">
                  Share your wallet address to receive ETH
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                aria-label="Close receive dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="bg-gray-200" />

            {/* QR Code Placeholder */}
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center aspect-square max-w-xs mx-auto border border-gray-300">
              <div className="text-center space-y-3">
                <QrCode className="h-48 w-48 mx-auto text-black" />
                <p className="text-sm text-black">QR Code</p>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Your Wallet Address</p>
              <div className="bg-gray-100 rounded-lg p-4 space-y-3 border border-gray-300">
                <code className="text-sm break-all block text-black">{walletAddress}</code>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-gray-300 text-black hover:bg-gray-100"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  Copy Address
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Only send ETH and ERC-20 tokens to this address. Sending other assets may result in permanent loss.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

