'use client';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getErrorMessage } from '@/lib/api-utils';
import Link from 'next/link';

interface DashboardStats {
  totalActiveCheckins: number;
  totalCompletedCheckouts: number;
  totalOccupiedParking: number;
  dailyIncome: number;
  cumulativeIncome: number;
  activeAccommodations: number;
}

type ActivityAction = 
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PARKING_CHECK_IN'
  | 'PARKING_CHECK_OUT'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATE'
  | 'USER_UPDATE';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchDashboardData = async () => {
        try {
          const [statsRes, activitiesRes] = await Promise.all([
            fetch('/api/dashboard/stats'),
            fetch('/api/dashboard/activities')
          ]);

          const statsData = await statsRes.json();
          const activitiesData = await activitiesRes.json();

          if (!statsRes.ok) {
            throw new Error(statsData.error || 'Failed to fetch dashboard stats');
          }

          if (!activitiesRes.ok) {
            throw new Error(activitiesData.error || 'Failed to fetch activities');
          }

          setStats(statsData);
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          setError(errorMessage);
          console.error('Error fetching dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [sessionStatus]);

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">You need to be authenticated to view this page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-4xl font-bold text-gray-900">Dashboard</h2>
            {session?.user && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm text-gray-600">
                  Logged in as <span className="font-semibold">{session.user.username}</span>
                  <span className="mx-2">|</span>
                  <span className="text-gray-500">{session.user.role}</span>
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              label="Active Check-ins" 
              value={stats?.totalActiveCheckins || 0}
              icon="👥"
              trend="+5% from last week"
            />
            <StatCard 
              label="Today's Income" 
              value={`UGX ${Number(stats?.dailyIncome || 0).toLocaleString()}`}
              icon="💰"
              highlight={true}
            />
            <StatCard 
              label="Occupied Cottages" 
              value={stats?.activeAccommodations || 0}
              icon="🏠"
              trend={`${((stats?.activeAccommodations || 0) / 20 * 100).toFixed(0)}% capacity`}
            />
            <StatCard 
              label="Parking Usage" 
              value={`${stats?.totalOccupiedParking || 0} spots`}
              icon="🅿️"
              trend="3 spots available"
            />
            <StatCard 
              label="Completed Checkouts" 
              value={stats?.totalCompletedCheckouts || 0}
              icon="✅"
            />
            <StatCard 
              label="Total Revenue" 
              value={`UGX ${Number(stats?.cumulativeIncome || 0).toLocaleString()}`}
              icon="📈"
              highlight={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  highlight = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: string;
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl
      ${highlight 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-white text-gray-900'
      }
    `}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gray-900/5"></div>
      <div className="p-6">
        <div className="flex items-center gap-4">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <p className={`text-sm ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          </div>
        </div>
        {trend && (
          <p className={`mt-4 text-sm ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
