'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api-utils';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface UserIncomeDetail {
  userId: string;
  username: string;
  totalIncome: number;
}

interface IncomeReportData {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalSystemIncome: number;
  userIncomeDetails: UserIncomeDetail[];
}

export default function IncomeReport() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<IncomeReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports/income?period=${period}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch income report');
      }
      setReportData(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error fetching income report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReportData();
    }
  }, [session, period, fetchReportData]);

  if (session?.user?.role !== 'ADMIN') {
    return <div className="text-red-600">Access Denied: Only administrators can view reports.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Income Reports</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Button onClick={() => setPeriod('daily')} variant={period === 'daily' ? 'primary' : 'secondary'}>Daily</Button>
        <Button onClick={() => setPeriod('weekly')} variant={period === 'weekly' ? 'primary' : 'secondary'}>Weekly</Button>
        <Button onClick={() => setPeriod('monthly')} variant={period === 'monthly' ? 'primary' : 'secondary'}>Monthly</Button>
      </div>

      {isLoading && <p>Loading report data...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {reportData && !isLoading && !error && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Total System Income ({period})</h2>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(reportData.totalSystemIncome)}</p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Income Per User ({period})</h2>
            {reportData.userIncomeDetails.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {reportData.userIncomeDetails.map(user => (
                  <li key={user.userId} className="py-4 flex justify-between items-center">
                    <span className="text-sm md:text-lg font-medium text-gray-700">{user.username}</span>
                    <span className="text-sm md:text-lg font-semibold text-gray-800">{formatCurrency(user.totalIncome)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No user income data for this period.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
} 