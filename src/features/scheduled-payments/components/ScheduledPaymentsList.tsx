'use client';

import { useScheduledPayments, useCancelScheduledPayment } from '../hooks';
import type { ScheduledPayment } from '../types';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function ScheduledPaymentsList() {
  const { data: payments, isLoading, error } = useScheduledPayments();
  const cancelMutation = useCancelScheduledPayment();

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled payment?')) {
      await cancelMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading scheduled payments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">Failed to load scheduled payments</p>
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No scheduled payments. Create one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    
    <div className="space-y-4">
      {payments.map((payment) => (
        <ScheduledPaymentCard
          key={payment.id}
          payment={payment}
          onCancel={handleCancel}
          isCancelling={cancelMutation.isPending}
        />
      ))}
    </div>
  );
}

interface ScheduledPaymentCardProps {
  payment: ScheduledPayment;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

function ScheduledPaymentCard({ payment, onCancel, isCancelling }: ScheduledPaymentCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date <= now) {
      return 'Due now';
    }
    
    return `in ${formatDistanceToNow(date)}`;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header: Amount and Status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">{payment.amount} ETH</p>
          <p className="text-sm text-muted-foreground">
            to {payment.recipientName || payment.recipientAddress}
          </p>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      {/* Scheduled Time */}
      <div className="text-sm">
        <p className="font-medium">Scheduled for:</p>
        <p className="text-muted-foreground">
          {formatDate(payment.scheduledFor)}
          {payment.status === 'pending' && (
            <span className="ml-2 text-blue-600">({getTimeUntil(payment.scheduledFor)})</span>
          )}
        </p>
      </div>

      {/* Recipient Address */}
      <div className="text-sm">
        <p className="font-medium">Recipient:</p>
        <p className="text-muted-foreground font-mono text-xs break-all">
          {payment.recipientAddress}
        </p>
      </div>

      {/* Note */}
      {payment.note && (
        <div className="text-sm">
          <p className="font-medium">Note:</p>
          <p className="text-muted-foreground">{payment.note}</p>
        </div>
      )}

      {/* Error Message */}
      {payment.errorMessage && (
        <div className="text-sm bg-red-50 border border-red-200 rounded p-2">
          <p className="font-medium text-red-700">Error:</p>
          <p className="text-red-600">{payment.errorMessage}</p>
        </div>
      )}

      {/* Transaction Link */}
      {payment.transactionId && (
        <div className="text-sm">
          <p className="font-medium">Transaction ID:</p>
          <p className="text-muted-foreground font-mono text-xs">{payment.transactionId}</p>
        </div>
      )}

      {/* Execution Time */}
      {payment.executedAt && (
        <div className="text-sm">
          <p className="font-medium">Executed at:</p>
          <p className="text-muted-foreground">{formatDate(payment.executedAt)}</p>
        </div>
      )}

      {/* Cancel Button (only for pending payments) */}
      {payment.status === 'pending' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCancel(payment.id)}
          disabled={isCancelling}
          className="w-full"
        >
          {isCancelling ? 'Cancelling...' : 'Cancel Payment'}
        </Button>
      )}
    </div>
  );
}

