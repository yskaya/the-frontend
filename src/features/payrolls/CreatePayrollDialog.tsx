'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarClock, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Separator } from '@/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/ui/sheet';
import { StickyNote } from '@/ui/sticky-note';
import { useContacts } from '@/features/contacts';
import { useCreatePayroll } from './hooks';
import type { PayrollPaymentFormData } from './types';

interface CreatePayrollDialogProps {
  onSuccess?: () => void;
  buttonClassName?: string;
  buttonText?: string;
}

export function CreatePayrollDialog({ 
  onSuccess, 
  buttonClassName = "font-semibold",
  buttonText = "Payroll"
}: CreatePayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePayroll();
  const { data: contacts, isLoading: contactsLoading } = useContacts();

  const [formData, setFormData] = useState<PayrollPaymentFormData>({
    recipientAddress: '',
    recipientName: '',
    amount: '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });
  const [payrollName, setPayrollName] = useState('');
  const [rows, setRows] = useState<Array<{ id: string; name: string; address: string; email?: string; amount: string }>>([
    { id: crypto.randomUUID(), name: '', address: '', email: '', amount: '' },
  ]);
  const [suggestionsByRow, setSuggestionsByRow] = useState<Record<string, Array<{ id?: string; name: string; address: string; email?: string }>>>({});
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [justAddedRowId, setJustAddedRowId] = useState<string | null>(null);
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!justAddedRowId) return;
    const timer = setTimeout(() => setJustAddedRowId(null), 400);
    return () => clearTimeout(timer);
  }, [justAddedRowId]);

  const filledRows = useMemo(
    () => rows.filter(row => row.address.trim()),
    [rows],
  );

  const totalAmountEth = useMemo(
    () => filledRows.reduce((sum, row) => sum + (parseFloat(row.amount || '0') || 0), 0),
    [filledRows],
  );

  const isValidAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/i.test(value.trim());

  const networkFeeEth = 0.002; // Placeholder flat network fee
  const appFeeRate = 0.005; // 0.5%
  const appFeeEth = totalAmountEth * appFeeRate;
  const grandTotalEth = totalAmountEth + (totalAmountEth > 0 ? appFeeEth + networkFeeEth : 0);

  const selectedContacts = contacts || [];

  const handleRowChange = (rowId: string, value: string) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, name: value, address: value, email: '' }
          : row,
      ),
    );
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setSuggestionsByRow(prev => ({ ...prev, [rowId]: [] }));
      return;
    }
    const matches = selectedContacts
      .filter(contact =>
        contact.name.toLowerCase().includes(normalized) ||
        contact.address.toLowerCase().includes(normalized)
      )
      .slice(0, 5)
      .map(contact => ({
        id: contact.id,
        name: contact.name,
        address: contact.address,
        email: contact.email,
      }));
    setSuggestionsByRow(prev => ({ ...prev, [rowId]: matches }));
  };

  const handleAmountInput = (rowId: string, value: string) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, amount: value }
          : row,
      ),
    );
  };

  const setRowFromContact = (rowId: string, contact: { id?: string; name: string; address: string; email?: string }) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, name: contact.name, address: contact.address, email: contact.email || '' }
          : row,
      ),
    );
    setSuggestionsByRow(prev => ({ ...prev, [rowId]: [] }));
  };

  const handleAddRow = () => {
    const newRow = { id: crypto.randomUUID(), name: '', address: '', email: '', amount: '' };
    setRows(prev => [...prev, newRow]);
    setJustAddedRowId(newRow.id);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length === 1 || removingRowId === rowId) return;
    setRemovingRowId(rowId);
    setTimeout(() => {
      setRows(prev => prev.filter(row => row.id !== rowId));
      setRemovingRowId(current => (current === rowId ? null : current));
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate payroll name
    if (!payrollName.trim()) {
      alert('Please enter a payroll name');
      return;
    }

    // Validate all recipients have amounts
    const filledRows = rows.filter(row => row.name.trim() || row.address.trim());

    if (filledRows.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    const invalidAmount = filledRows.find(row => !row.amount || parseFloat(row.amount) <= 0);
    if (invalidAmount) {
      alert('Please enter a valid amount for each recipient');
      return;
    }

    const invalidAddress = filledRows.find(row => !isValidAddress(row.address));
    if (invalidAddress) {
      toast.error('Each recipient needs a valid wallet address (0x...)');
      return;
    }

    // Combine date and time into ISO string
    const scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

    // Validate future date (allow minimum 30 seconds from now)
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
    
    if (scheduledFor <= minimumTime) {
      alert('Scheduled time must be at least 30 seconds in the future');
      return;
    }

    // Create payroll with recipients (will be handled by backend API)
    try {
      await createMutation.mutateAsync({
        name: payrollName,
        scheduledFor: scheduledFor.toISOString(),
        note: formData.note || undefined,
        recipients: filledRows.map(row => {
          const trimmedAddress = row.address.trim();
          const trimmedName = row.name.trim();
          const trimmedEmail = row.email?.trim();

          return {
            recipientAddress: trimmedAddress,
            recipientName: trimmedName && trimmedName.toLowerCase() !== trimmedAddress.toLowerCase() ? trimmedName : undefined,
            recipientEmail: trimmedEmail || undefined,
            amount: row.amount,
          };
        }),
      });

      toast.success('Payroll created successfully');
      setRows([{ id: crypto.randomUUID(), name: '', address: '', email: '', amount: '' }]);
      setIsEditingNote(false);
      setNoteDraft('');

      if (onSuccess) {
        onSuccess();
      }

      setOpen(false);
    } catch (error) {
      toast.error('Failed to create payroll');
      console.error(error);
    }
  };

  const updateField = (field: keyof PayrollPaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={buttonClassName}>
          <CalendarClock className="h-5 w-5" />
          {buttonText}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
      >
        <div className="h-full bg-white text-black overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Create Payroll Payment
            </h2>
            <p className="text-sm text-gray-600">
              Select contacts and schedule when to send the payment
            </p>
          </div>

          <Separator className="bg-gray-200" />
        
          <form onSubmit={handleSubmit} className="space-y-6">
          <StickyNote
            value={isEditingNote ? noteDraft : (formData.note || '')}
            isEditing={isEditingNote}
            onClick={() => {
              setNoteDraft(formData.note || '');
              setIsEditingNote(true);
            }}
            onChange={(nextValue) => setNoteDraft(nextValue)}
            onSave={() => {
              const sanitized = noteDraft.startsWith('NOTE: ')
                ? noteDraft.slice(6).trim()
                : noteDraft.trim();
              updateField('note', sanitized);
              setIsEditingNote(false);
            }}
            onCancel={() => {
              setNoteDraft(formData.note || '');
              setIsEditingNote(false);
            }}
            placeholder="Click to add a note..."
            autoFocus
          />

          {/* Payroll Name */}
          <div className="relative">
            <Input
              id="payrollName"
              type="text"
              placeholder=" "
              value={payrollName}
              onChange={(e) => setPayrollName(e.target.value)}
              className="peer h-16 pt-8 pb-4 placeholder-transparent"
              required
            />
            <Label
              htmlFor="payrollName"
              className="pointer-events-none absolute left-4 top-[0.5rem] text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:text-xs peer-focus:text-purple-500"
            >
              Payroll Name <span className="text-red-500">*</span>
            </Label>
          </div>

          {/* Scheduled Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Input
                id="scheduledDate"
                type="date"
                placeholder=" "
                value={formData.scheduledDate}
                onChange={(e) => updateField('scheduledDate', e.target.value)}
                className="peer h-16 pt-8 pb-4 placeholder-transparent"
                required
              />
              <Label
                htmlFor="scheduledDate"
                className="pointer-events-none absolute left-4 top-[0.5rem] text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:text-xs peer-focus:text-purple-500"
              >
                Date <span className="text-red-500">*</span>
              </Label>
            </div>

            <div className="relative">
              <Input
                id="scheduledTime"
                type="time"
                placeholder=" "
                value={formData.scheduledTime}
                onChange={(e) => updateField('scheduledTime', e.target.value)}
                className="peer h-16 pt-8 pb-4 placeholder-transparent"
                required
              />
              <Label
                htmlFor="scheduledTime"
                className="pointer-events-none absolute left-4 top-[0.5rem] text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:text-xs peer-focus:text-purple-500"
              >
                Time <span className="text-red-500">*</span>
              </Label>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Recipients</p>
            </div>
            <div className="space-y-3">
              {rows.map((row, index) => {
                const contactMatch = selectedContacts.find(
                  contact =>
                    contact.name.toLowerCase() === row.name.toLowerCase() ||
                    contact.address.toLowerCase() === row.address.toLowerCase()
                );
                const rowSuggestions = suggestionsByRow[row.id] || [];
                const isNew = justAddedRowId === row.id;
                const isRemoving = removingRowId === row.id;
 
                return (
                  <div
                    key={row.id}
                    className={`flex flex-col gap-3 md:flex-row md:items-start transition-all duration-300 ${
                      isNew ? 'animate-in fade-in-0 slide-in-from-bottom-2' : ''
                    } ${isRemoving ? 'animate-out fade-out-0 slide-out-to-top-2 pointer-events-none' : ''}`}
                  >
                    <div className="relative md:flex-1">
                      <Input
                        placeholder=" "
                        value={row.address}
                        onChange={(e) => handleRowChange(row.id, e.target.value)}
                        className="peer h-16 px-4 pt-8 pb-4 placeholder-transparent"
                      />
                      <Label
                        className="pointer-events-none absolute left-4 top-[0.5rem] text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-purple-500"
                      >
                        Wallet
                        {contactMatch && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-600">
                              {contactMatch.name || contactMatch.email || ''}
                            </span>
                          </span>
                        )}
                      </Label>
                      {!contactMatch && row.address && rowSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-sm">
                          {rowSuggestions.map(suggestion => (
                            <button
                              key={suggestion.id ?? suggestion.address}
                              type="button"
                              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                              onClick={() => {
                                setRowFromContact(row.id, suggestion);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{suggestion.name}</p>
                                {suggestion.email && (
                                  <p className="text-xs text-gray-500">{suggestion.email}</p>
                                )}
                                <p className="text-xs font-mono text-gray-500 break-all">{suggestion.address}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 md:w-[260px]">
                      <div className="relative flex-1">
                        <Input
                          placeholder=" "
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          value={row.amount}
                          onChange={(e) => handleAmountInput(row.id, e.target.value)}
                          className="peer h-16 px-4 pt-8 pb-4 text-lg font-semibold placeholder-transparent"
                          inputMode="decimal"
                        />
                        <Label
                          className="pointer-events-none absolute left-4 top-[0.5rem] text-xs text-gray-500 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[0.5rem] peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-purple-500"
                        >
                          Amount (ETH)
                          {row.amount && (
                            <span className="ml-2 text-[11px] text-gray-400">
                              ≈ ${(parseFloat(row.amount || '0') * 3243).toFixed(2)} USD
                            </span>
                          )}
                        </Label>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 w-8 shrink-0 text-gray-400 hover:text-gray-700"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 group flex flex-col items-center gap-2">
                <div className="flex w-full items-center justify-center gap-3 text-sm font-medium text-gray-500">
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-colors duration-200 group-hover:via-purple-400" />
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full border border-dashed border-gray-300 group-hover:border-purple-400 group-hover:text-purple-600 transition-all duration-200"
                  >
                    + add more
                  </button>
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-colors duration-200 group-hover:via-purple-400" />
                </div>
               </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-100 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Recipients</span>
              <span className="text-black font-medium">{filledRows.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-black font-semibold">{totalAmountEth.toFixed(3)} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee (est.)</span>
              <span className="text-black">{totalAmountEth > 0 ? networkFeeEth.toFixed(3) : '0.000'} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (0.5%)</span>
              <span className="text-black">{totalAmountEth > 0 ? appFeeEth.toFixed(3) : '0.000'} ETH</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/40 pt-2">
              <span className="text-gray-600">Total Due</span>
              <span className="text-black font-semibold">{grandTotalEth.toFixed(3)} ETH</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {/* TODO: Replace with live gas + FX data */}
              Estimates include a flat network fee and 0.5% platform fee. Update once final pricing service is wired in.
            </p>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-white">
            <Button
              type="submit"
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:from-purple-500 disabled:to-indigo-500 disabled:opacity-40"
              disabled={
                createMutation.isPending || 
                filledRows.length === 0 ||
                !payrollName.trim() ||
                rows.some(row => (row.name.trim() || row.address.trim()) && (!row.amount || parseFloat(row.amount) <= 0))
              }
            >
              {createMutation.isPending
                ? 'Creating Payroll...'
                : `Create Payroll (${filledRows.length} recipient${filledRows.length === 1 ? '' : 's'})`}
            </Button>
          </div>
          </form>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


