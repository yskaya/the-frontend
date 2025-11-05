'use client';

import { useState, useEffect } from 'react';
import { useCreatePayroll } from '../hooks';
import type { ScheduledPaymentFormData } from '../types';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Checkbox } from '@/ui/checkbox';
import { CalendarClock, X } from 'lucide-react';
import { ScrollArea } from '@/ui/scroll-area';

// Import contacts API
import { useContacts } from '@/features/contacts';

interface PayrollDialogProps {
  onSuccess?: () => void;
  buttonClassName?: string;
  buttonText?: string;
}

export function PayrollDialog({ 
  onSuccess, 
  buttonClassName = "font-semibold",
  buttonText = "Payroll"
}: PayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePayroll();
  const { data: contacts, isLoading: contactsLoading } = useContacts();

  const [formData, setFormData] = useState<ScheduledPaymentFormData>({
    recipientAddress: '',
    recipientName: '',
    amount: '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });
  const [payrollName, setPayrollName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [recipientAmounts, setRecipientAmounts] = useState<Record<string, string>>({}); // contactId -> amount
  const [showContactSelect, setShowContactSelect] = useState(false);

  // Removed handleContactToggle - using inline handlers to prevent infinite loops

  const handleRemoveContact = (contactId: string) => {
    setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    setRecipientAmounts(prev => {
      const updated = { ...prev };
      delete updated[contactId];
      return updated;
    });
  };

  const handleAmountChange = (contactId: string, amount: string) => {
    setRecipientAmounts(prev => ({
      ...prev,
      [contactId]: amount,
    }));
  };

  const selectedContacts = contacts?.filter(c => selectedContactIds.includes(c.id)) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one contact selected
    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    // Validate payroll name
    if (!payrollName.trim()) {
      alert('Please enter a payroll name');
      return;
    }

    // Validate all recipients have amounts
    const missingAmounts = selectedContactIds.filter(id => !recipientAmounts[id] || parseFloat(recipientAmounts[id]) <= 0);
    if (missingAmounts.length > 0) {
      alert('Please enter an amount for all selected recipients');
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
    await createMutation.mutateAsync({
      name: payrollName,
      scheduledFor: scheduledFor.toISOString(),
      note: formData.note || undefined,
      recipients: selectedContacts.map(contact => ({
        recipientAddress: contact.address,
        recipientName: contact.name || undefined,
        amount: recipientAmounts[contact.id],
      })),
    });

    // Reset form and close dialog
    setFormData({
      recipientAddress: '',
      recipientName: '',
      amount: '',
      scheduledDate: '',
      scheduledTime: '',
      note: '',
    });
    setPayrollName('');
    setSelectedContactIds([]);
    setRecipientAmounts({});
    setShowContactSelect(false);
    setOpen(false);
    onSuccess?.();
  };

  const updateField = (field: keyof ScheduledPaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={buttonClassName}>
          <CalendarClock className="h-5 w-5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Payroll Payment</DialogTitle>
          <DialogDescription>
            Select a contact and schedule when to send the payment
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Payroll Name */}
          <div className="space-y-2">
            <Label htmlFor="payrollName">
              Payroll Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="payrollName"
              type="text"
              placeholder="October 2025 Payroll"
              value={payrollName}
              onChange={(e) => setPayrollName(e.target.value)}
              required
            />
          </div>

          {/* Contact Multi-Selector */}
          <div className="space-y-2">
            <Label>
              Select Contacts <span className="text-red-500">*</span>
            </Label>
            {contactsLoading ? (
              <div className="text-sm text-muted-foreground">Loading contacts...</div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactSelect(!showContactSelect)}
                  className="w-full justify-between"
                >
                  <span>
                    {selectedContactIds.length === 0
                      ? 'Choose contacts'
                      : `${selectedContactIds.length} contact${selectedContactIds.length > 1 ? 's' : ''} selected`}
                  </span>
                  <span className="text-xs text-muted-foreground">▼</span>
                </Button>
                
                {showContactSelect && (
                  <div className="border rounded-md bg-white p-2 max-h-[200px] overflow-y-auto">
                    <ScrollArea className="h-full">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            checked={selectedContactIds.includes(contact.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContactIds(prev => [...prev, contact.id]);
                              } else {
                                setSelectedContactIds(prev => prev.filter(id => id !== contact.id));
                              }
                            }}
                          />
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              const isSelected = selectedContactIds.includes(contact.id);
                              if (isSelected) {
                                setSelectedContactIds(prev => prev.filter(id => id !== contact.id));
                              } else {
                                setSelectedContactIds(prev => [...prev, contact.id]);
                              }
                            }}
                          >
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Show selected contacts with amount inputs */}
                {selectedContacts.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Set Amounts per Recipient</Label>
                    {selectedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 bg-muted rounded-md space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {contact.address}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveContact(contact.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`amount-${contact.id}`} className="text-xs whitespace-nowrap">
                            Amount (ETH):
                          </Label>
                          <Input
                            id={`amount-${contact.id}`}
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            placeholder="0.01"
                            value={recipientAmounts[contact.id] || ''}
                            onChange={(e) => handleAmountChange(contact.id, e.target.value)}
                            className="flex-1"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No contacts found. Add contacts first.
              </div>
            )}
          </div>

          {/* Scheduled Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => updateField('scheduledDate', e.target.value)}
                required
              />
            </div>

            {/* Scheduled Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => updateField('scheduledTime', e.target.value)}
                required
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Time is in your local timezone
          </p>

          {/* Note (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="October 2025 salary"
              value={formData.note}
              onChange={(e) => updateField('note', e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                createMutation.isPending || 
                selectedContactIds.length === 0 || 
                !payrollName.trim() ||
                selectedContactIds.some(id => !recipientAmounts[id] || parseFloat(recipientAmounts[id]) <= 0)
              }
            >
              {createMutation.isPending ? 'Creating Payroll...' : `Create Payroll (${selectedContactIds.length} recipient${selectedContactIds.length > 1 ? 's' : ''})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

