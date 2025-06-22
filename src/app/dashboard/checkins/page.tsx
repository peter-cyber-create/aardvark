'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CheckinForm from '@/components/CheckinForm';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api-utils'; 
import { Card } from '@/components/Card';
import CheckInForm from '@/components/CheckinForm';

export default function CheckInsPage() {
  const { data: session } = useSession();

  if (!session?.user || session.user.role !== 'STAFF') {
    return (
      <Card>
        <div className="p-6 text-center text-red-500">You do not have permission to access Check-ins.</div>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Client Check-ins</h1>

      <div>
        <CheckInForm />
      </div>
    </div>
  );
}

