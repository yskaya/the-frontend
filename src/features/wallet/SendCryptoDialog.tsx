import { useState, useEffect } from "react";
import { Send, Search, User } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { toast } from "sonner";
import { DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import { useContacts } from "@/features/contacts";
import { useSendCrypto } from "./useWallet";

interface SendCryptoDialogProps {
  recipientAddress?: string;
  recipientName?: string;
  onSuccess?: () => void;
}

export function SendCryptoDialog({ recipientAddress = "", recipientName = "", onSuccess }: SendCryptoDialogProps) {
  const [address, setAddress] = useState(recipientAddress);
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactSearch, setShowContactSearch] = useState(!recipientAddress);
  
  const { data: contacts = [] } = useContacts();
  const sendCryptoMutation = useSendCrypto();

  // Update address when prop changes
  useEffect(() => {
    if (recipientAddress) {
      setAddress(recipientAddress);
      setShowContactSearch(false);
    }
  }, [recipientAddress]);

  // Filter contacts by search
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Limit to 5 results

  const selectContact = (contactAddress: string, contactName: string) => {
    setAddress(contactAddress);
    setSearchQuery("");
    setShowContactSearch(false);
    toast.success(`Selected ${contactName}`);
  };

  const handleSend = async () => {
    if (!address || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      toast.error("Invalid Ethereum address");
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }

    try {
      await sendCryptoMutation.mutateAsync({
        to: address,
        amount: amount,
      });

      // Clear form on success
      setAddress("");
      setAmount("");
      setSearchQuery("");
      setShowContactSearch(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is already handled by useSendCrypto hook
      console.error("Send transaction error:", error);
    }
  };

  return (
    <div className="space-y-6 bg-white text-black rounded-lg -m-6 p-6">
      <DialogHeader>
        <DialogTitle className="text-black">
          {recipientName ? `Send to ${recipientName}` : "Send Crypto"}
        </DialogTitle>
        <DialogDescription className="text-gray-600">
          Send ETH to another wallet address
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="recipient" className="text-black">Recipient Address</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs text-black hover:bg-gray-100"
              onClick={() => setShowContactSearch(!showContactSearch)}
            >
              <User className="h-3 w-3" />
              {showContactSearch ? "Manual" : "Contacts"}
            </Button>
          </div>

          {showContactSearch ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-100 border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
              
              {searchQuery && filteredContacts.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[200px] overflow-y-auto">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => selectContact(contact.address, contact.name)}
                      className="w-full p-3 hover:bg-gray-100 transition-colors text-left flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black text-sm">{contact.name}</p>
                        <code className="text-xs text-gray-500 block truncate">
                          {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                        </code>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchQuery && filteredContacts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No contacts found</p>
              )}

              {!searchQuery && (
                <p className="text-xs text-gray-500 text-center py-3">
                  Type to search your {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="recipient"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-gray-100 border-gray-300 text-black placeholder:text-gray-500"
              />
              {recipientName && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Sending to contact: <span className="font-medium text-black">{recipientName}</span></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-black">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-100 border-gray-300 text-black placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-600">
            Available: 3.847 ETH
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Network Fee</span>
            <span className="text-black">~0.002 ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="text-black font-semibold">{amount ? (parseFloat(amount) + 0.002).toFixed(3) : "0.002"} ETH</span>
          </div>
        </div>

        <Button
          className="w-full gap-2 bg-black text-white hover:bg-gray-800"
          onClick={handleSend}
          disabled={sendCryptoMutation.isPending || !address || !amount}
        >
          <Send className="h-4 w-4" />
          {sendCryptoMutation.isPending ? "Sending..." : "Send Transaction"}
        </Button>
      </div>
    </div>
  );
}
