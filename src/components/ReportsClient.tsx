"use client";

import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportFilters {
  startDate: string;
  endDate: string;
  cottageType?: string;
}

interface CottageStats {
  cottageNumber: string;
  totalBookings: number;
  revenue: number;
  occupancyRate: number;
  averageStayDuration: number;
}

interface GuestStats {
  totalGuests: number;
  adultsCount: number;
  childrenCount: number;
  averageGroupSize: number;
  repeatGuests: number;
}

interface ActivityStats {
  name: string;
  count: number;
  revenue: number;
}

interface RevenueBreakdown {
  accommodation: number;
  activities: number;
  other: number;
}

interface ReportData {
  totalRevenue: number;
  revenueBreakdown: RevenueBreakdown;
  totalBookings: number;
  averageStayDuration: number;
  occupancyRate: number;
  cottageStats: CottageStats[];
  guestStats: GuestStats;
  popularActivities: ActivityStats[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export default function ReportsClient() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReportData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.cottageType && { cottageType: filters.cottageType }),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Financial Reports & Analytics</h1>
        <Button
          onClick={fetchReportData}
          className="btn-primary"
          disabled={isLoading || !filters.startDate || !filters.endDate}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Report'}
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cottage Type</label>
            <select
              value={filters.cottageType}
              onChange={(e) => handleFilterChange('cottageType', e.target.value)}
              className="input-field"
            >
              <option value="">All Cottages</option>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double</option>
              <option value="TWIN">Twin</option>
              <option value="TRIPLE">Triple</option>
              <option value="QUADRUPLE">Quadruple</option>
            </select>
          </div>
        </div>
      </Card>

      {reportData && (
        <div className="space-y-8">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Bookings</h3>
              <p className="text-3xl font-bold text-gray-900">{reportData.totalBookings}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Stay</h3>
              <p className="text-3xl font-bold text-gray-900">{reportData.averageStayDuration.toFixed(1)} days</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Occupancy Rate</h3>
              <p className="text-3xl font-bold text-gray-900">{reportData.occupancyRate.toFixed(1)}%</p>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="h-64">
                <Doughnut
                  data={{
                    labels: ['Accommodation', 'Activities', 'Other'],
                    datasets: [{
                      data: [
                        reportData.revenueBreakdown.accommodation,
                        reportData.revenueBreakdown.activities,
                        reportData.revenueBreakdown.other,
                      ],
                      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: reportData.monthlyRevenue.map(item => item.month),
                    datasets: [{
                      label: 'Revenue',
                      data: reportData.monthlyRevenue.map(item => item.revenue),
                      backgroundColor: '#10B981',
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Guest Statistics */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Guests</p>
                <p className="text-xl font-semibold">{reportData.guestStats.totalGuests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adults</p>
                <p className="text-xl font-semibold">{reportData.guestStats.adultsCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Children</p>
                <p className="text-xl font-semibold">{reportData.guestStats.childrenCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Group Size</p>
                <p className="text-xl font-semibold">{reportData.guestStats.averageGroupSize.toFixed(1)}</p>
              </div>
            </div>
          </Card>

          {/* Cottage Performance Table */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cottage Performance</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cottage</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Occupancy Rate</th>
                    <th>Avg. Stay Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.cottageStats.map((stat) => (
                    <tr key={stat.cottageNumber}>
                      <td>{stat.cottageNumber}</td>
                      <td>{stat.totalBookings}</td>
                      <td>{formatCurrency(stat.revenue)}</td>
                      <td>{stat.occupancyRate.toFixed(1)}%</td>
                      <td>{stat.averageStayDuration.toFixed(1)} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Popular Activities */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Activities</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.popularActivities.map((activity) => (
                    <tr key={activity.name}>
                      <td>{activity.name}</td>
                      <td>{activity.count}</td>
                      <td>{formatCurrency(activity.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}