'use client';

import { useState, useEffect } from 'react';
import { useCreateScheduledPayment } from '../hooks';
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
import { CalendarClock } from 'lucide-react';

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
  const createMutation = useCreateScheduledPayment();
  const { data: contacts, isLoading: contactsLoading } = useContacts();

  const [formData, setFormData] = useState<ScheduledPaymentFormData>({
    recipientAddress: '',
    recipientName: '',
    amount: '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });

  const handleContactSelect = (contactId: string) => {
    const contact = contacts?.find(c => c.id === contactId);
    if (contact) {
      setFormData(prev => ({
        ...prev,
        recipientAddress: contact.address,
        recipientName: contact.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time into ISO string
    const scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

    // Validate future date (allow minimum 30 seconds from now)
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
    
    if (scheduledFor <= minimumTime) {
      alert('Scheduled time must be at least 30 seconds in the future');
      return;
    }

    await createMutation.mutateAsync({
      recipientAddress: formData.recipientAddress,
      recipientName: formData.recipientName || undefined,
      amount: formData.amount,
      scheduledFor: scheduledFor.toISOString(),
      note: formData.note || undefined,
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
          {/* Contact Selector */}
          <div className="space-y-2">
            <Label htmlFor="contact">
              Select Contact <span className="text-red-500">*</span>
            </Label>
            {contactsLoading ? (
              <div className="text-sm text-muted-foreground">Loading contacts...</div>
            ) : contacts && contacts.length > 0 ? (
              <Select onValueChange={handleContactSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.address.slice(0, 6)}...{contact.address.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground">
                No contacts found. Add contacts first.
              </div>
            )}
          </div>

          {/* Show selected contact details */}
          {formData.recipientAddress && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <p className="font-medium">{formData.recipientName}</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {formData.recipientAddress}
                </p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (ETH) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0.000001"
              placeholder="0.01"
              value={formData.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              required
            />
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
              disabled={createMutation.isPending || !formData.recipientAddress}
            >
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

