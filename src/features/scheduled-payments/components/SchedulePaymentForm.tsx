'use client';

import { useState } from 'react';
import { useCreateScheduledPayment } from '../hooks';
import type { ScheduledPaymentFormData } from '../types';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';

interface SchedulePaymentFormProps {
  onSuccess?: () => void;
  prefilledAddress?: string;
  prefilledName?: string;
}

export function SchedulePaymentForm({
  onSuccess,
  prefilledAddress = '',
  prefilledName = '',
}: SchedulePaymentFormProps) {
  const createMutation = useCreateScheduledPayment();

  const [formData, setFormData] = useState<ScheduledPaymentFormData>({
    recipientAddress: prefilledAddress,
    recipientName: prefilledName,
    amount: '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });

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

    // Reset form
    setFormData({
      recipientAddress: '',
      recipientName: '',
      amount: '',
      scheduledDate: '',
      scheduledTime: '',
      note: '',
    });

    onSuccess?.();
  };

  const updateField = (field: keyof ScheduledPaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Get minimum date (today) in YYYY-MM-DD format
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Payment</CardTitle>
        <CardDescription>
          Schedule a one-time ETH payment to be sent automatically at a future date and time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipientAddress">
              Recipient Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientAddress"
              placeholder="0x..."
              value={formData.recipientAddress}
              onChange={(e) => updateField('recipientAddress', e.target.value)}
              required
              pattern="0x[a-fA-F0-9]{40}"
              title="Must be a valid Ethereum address (0x...)"
            />
          </div>

          {/* Recipient Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
            <Input
              id="recipientName"
              placeholder="Alice"
              value={formData.recipientName}
              onChange={(e) => updateField('recipientName', e.target.value)}
            />
          </div>

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
            <p className="text-sm text-muted-foreground">
              Time is in your local timezone
            </p>
          </div>

          {/* Note (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Salary payment for October 2025"
              value={formData.note}
              onChange={(e) => updateField('note', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Scheduling...' : 'Schedule Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

