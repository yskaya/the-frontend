import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, Search, User } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Separator } from "@/ui/separator";
import { toast } from "sonner";
import { useContacts } from "@/features/contacts";
import { useSendCrypto } from "./useWallet";

interface SendCryptoDialogProps {
  recipientAddress?: string;
  recipientName?: string;
  onSuccess?: () => void;
}

export function SendCryptoDialog({ recipientAddress = "", recipientName = "", onSuccess }: SendCryptoDialogProps) {
  const [inputValue, setInputValue] = useState(recipientAddress || "");
  const [amount, setAmount] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const { data: contacts = [] } = useContacts();
  const sendCryptoMutation = useSendCrypto();

  const isValidAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/i.test(value.trim());
  const shortAddress = (value: string) =>
    value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

  useEffect(() => {
    setHasUserEdited(false);
  }, [recipientAddress, recipientName]);

  useEffect(() => {
    if (hasUserEdited) {
      return;
    }

    if (recipientAddress) {
      const matchByAddress = contacts.find(
        (contact) => contact.address.toLowerCase() === recipientAddress.toLowerCase()
      );

      if (matchByAddress) {
        setSelectedContactId(matchByAddress.id ?? matchByAddress.address);
        setInputValue(matchByAddress.name);
        return;
      }

      setSelectedContactId(null);
      setInputValue(recipientAddress);
      return;
    }

    if (recipientName) {
      const matchByName = contacts.find(
        (contact) => contact.name.toLowerCase() === recipientName.toLowerCase()
      );

      if (matchByName) {
        setSelectedContactId(matchByName.id ?? matchByName.address);
        setInputValue(matchByName.name);
        return;
      }

      setSelectedContactId(null);
      setInputValue(recipientName);
      return;
    }
  }, [contacts, hasUserEdited, recipientAddress, recipientName]);

  const normalizedInput = useMemo(() => inputValue.trim().toLowerCase(), [inputValue]);

  const filteredContacts = useMemo(() => {
    if (!normalizedInput) {
      return [];
    }

    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(normalizedInput) ||
          contact.address.toLowerCase().includes(normalizedInput)
      )
      .slice(0, 5);
  }, [contacts, normalizedInput]);

  const selectedContact = useMemo(() => {
    if (!selectedContactId) {
      return null;
    }

    return (
      contacts.find(
        (contact) =>
          contact.id === selectedContactId ||
          contact.address === selectedContactId
      ) ?? null
    );
  }, [contacts, selectedContactId]);

  const exactContactMatch = useMemo(() => {
    if (!normalizedInput) {
      return null;
    }

    return (
      contacts.find(
        (contact) =>
          contact.name.toLowerCase() === normalizedInput ||
          contact.address.toLowerCase() === normalizedInput
      ) ?? null
    );
  }, [contacts, normalizedInput]);

  const activeContact = selectedContact ?? exactContactMatch;
  const resolvedAddress = activeContact?.address ?? (isValidAddress(inputValue) ? inputValue.trim() : "");
  const resolvedContactName = activeContact?.name ?? "";
  const suggestionList = useMemo(() => {
    if (filteredContacts.length === 0) {
      return [];
    }

    if (!selectedContactId) {
      return filteredContacts;
    }

    return filteredContacts.filter(
      (contact) => (contact.id ?? contact.address) !== selectedContactId
    );
  }, [filteredContacts, selectedContactId]);

  const showSuggestions =
    normalizedInput.length > 0 &&
    suggestionList.length > 0 &&
    !isValidAddress(inputValue);
  const canSend = !!amount && !!resolvedAddress && isValidAddress(resolvedAddress);

  const handleSelectContact = (contact: (typeof contacts)[number]) => {
    const contactKey = contact.id ?? contact.address;
    setSelectedContactId(contactKey);
    setInputValue(contact.address);
    setHasUserEdited(true);
    toast.success(`Selected ${contact.name}`);
  };

  const handleRecipientChange = (value: string) => {
    setInputValue(value);
    setSelectedContactId(null);
    setHasUserEdited(true);
  };

  const handleRecipientKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      showSuggestions &&
      suggestionList.length > 0 &&
      !isValidAddress(inputValue)
    ) {
      event.preventDefault();
      handleSelectContact(suggestionList[0]);
    }
  };

  const handleSend = async () => {
    const finalAddress = resolvedAddress.trim();

    if (!finalAddress) {
      toast.error("Please select a contact or enter a valid wallet address");
      return;
    }

    if (!isValidAddress(finalAddress)) {
      toast.error("Invalid Ethereum address");
      return;
    }

    if (!amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }

    try {
      await sendCryptoMutation.mutateAsync({
        to: finalAddress,
        amount,
      });

      setInputValue("");
      setAmount("");
      setSelectedContactId(null);
      setHasUserEdited(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Send transaction error:", error);
    }
  };

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {recipientName ? `Send to ${recipientName}` : "Send Crypto"}
        </h2>
        <p className="text-sm text-gray-600">
          Send ETH to another wallet address
        </p>
      </div>

      <Separator className="bg-gray-200" />

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex-1 space-y-2">
              <div className="relative group">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="recipient"
                  placeholder=" "
                  value={inputValue}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  onKeyDown={handleRecipientKeyDown}
                  className="peer h-16 pl-12 pr-4 pt-8 pb-4 placeholder-transparent"
                  autoComplete="off"
                />
                <Label
                  htmlFor="recipient"
                  className="pointer-events-none absolute left-12 top-[0.5rem] translate-y-0 text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-purple-500"
                >
                  Recipient
                  {activeContact && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-600">{resolvedContactName || "Contact"}</span>
                    </span>
                  )}
                </Label>

                {/* Removed wallet address code block per design update */}
              </div>

              <div className="relative">
                {showSuggestions && (
                  <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-[220px] overflow-y-auto">
                    {suggestionList.map((contact) => (
                      <button
                        key={contact.id ?? contact.address}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate">{contact.address}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!showSuggestions && normalizedInput && !activeContact && !isValidAddress(inputValue) && (
                <p className="text-xs text-gray-500 px-1">
                  No contacts found. Paste a valid wallet address to send.
                </p>
              )}
            </div>

            <div className="w-full max-w-[220px] space-y-1">
              <div className="relative group">
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  placeholder=" "
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="peer h-16 pr-4 pt-8 pb-4 text-lg font-semibold placeholder-transparent"
                  inputMode="decimal"
                />
                <Label
                  htmlFor="amount"
                  className="pointer-events-none absolute left-4 top-[0.5rem] translate-y-0 text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-purple-500"
                >
                  Amount (ETH)
                  {amount && (
                    <span className="ml-2 text-[11px] text-gray-400">
                      ≈ ${(parseFloat(amount || "0") * 3243).toFixed(2)} USD
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Funds</span>
            <span className="text-black font-medium">3.847 ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount</span>
            <span className="text-black font-medium text-right">
              {amount ? `${parseFloat(amount).toFixed(3)} ETH` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Network Fee</span>
            <span className="text-black text-right">~0.002 ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="text-black font-semibold text-right">
              {amount ? (parseFloat(amount) + 0.002).toFixed(3) : "0.002"} ETH
            </span>
          </div>
          {amount && parseFloat(amount) + 0.002 > 3.847 && (
            <p className="text-xs text-red-500">
              Insufficient funds. Reduce the amount or top up your balance.
            </p>
          )}
        </div>

        <Button
          className="w-full h-12 gap-2 rounded-2xl bg-black text-white hover:bg-gray-800"
          onClick={handleSend}
          disabled={sendCryptoMutation.isPending || !canSend}
        >
          <Send className="h-4 w-4" />
          {sendCryptoMutation.isPending ? "Sending..." : "Send Transaction"}
        </Button>
      </div>
    </div>
  );
}
