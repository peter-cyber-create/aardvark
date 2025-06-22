'use client';

import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/lib/api-utils';
import { formatCurrency } from '@/lib/utils';
import { Card } from './Card'; // Assuming Card is in components

export default function DailyIncomeDisplay() {
  const [totalIncome, setTotalIncome] = useState<number | null>(null);
  const [isDailyIncomeLoading, setIsDailyIncomeLoading] = useState(true);
  const [dailyIncomeError, setDailyIncomeError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('daily');

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as 'daily' | 'weekly' | 'monthly' | 'all-time');
  };

  // Fetch daily accommodation income on component mount
  useEffect(() => {
    const fetchIncome = async () => {
      setIsDailyIncomeLoading(true);
      setDailyIncomeError(null);
      try {
        const response = await fetch(`/api/checkins/daily-stats?period=${selectedPeriod}`); // Fetch with selected period
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch ${selectedPeriod} income`);
        }
        setTotalIncome(data.totalIncome); // Set the totalIncome from the response
      } catch (err: unknown) {
        setDailyIncomeError(getErrorMessage(err));
        console.error(`Error fetching ${selectedPeriod} income:`, err);
      } finally {
        setIsDailyIncomeLoading(false);
      }
    };
    fetchIncome();
  }, [selectedPeriod]); // Depend on selectedPeriod

  // Helper to format period display text
  const formatPeriodText = (period: 'daily' | 'weekly' | 'monthly' | 'all-time') => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'all-time':
        return 'All-Time';
      default:
        return '';
    }
  };

  return (
    <>
      {isDailyIncomeLoading && <p>Loading {formatPeriodText(selectedPeriod).toLowerCase()} income...</p>}
      {dailyIncomeError && <div className="text-red-500 text-sm">{dailyIncomeError}</div>}
      {totalIncome !== null && (
        <Card>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold text-gray-900">{formatPeriodText(selectedPeriod)} Income: {formatCurrency(totalIncome)} UGX</h3>
             <select value={selectedPeriod} onChange={handlePeriodChange} className="rounded-md border border-gray-300 py-1 px-2 text-sm">
               <option value="daily">Daily</option>
               <option value="weekly">Weekly</option>
               <option value="monthly">Monthly</option>
               <option value="all-time">All-Time</option>
             </select>
           </div>
        </Card>
      )}
    </>
  );
} 