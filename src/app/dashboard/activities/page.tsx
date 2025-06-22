'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate, formatShortDate, truncateString } from '@/lib/utils';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { getErrorMessage } from '@/lib/api-utils';

interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    username: string;
    role: string;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'CHECK_IN',
  'CHECK_OUT',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
] as const;

export default function ActivitiesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    action: '',
    username: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Determine if the user is admin
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchActivities = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.action && { action: filters.action }),
      });

      const response = await fetch(`/api/activities?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activities');
      }

      let filteredActivities = data.data;
      if (filters.username) {
        const usernameLower = filters.username.toLowerCase();
        filteredActivities = filteredActivities.filter(
          (activity: Activity) => activity.user.username.toLowerCase().includes(usernameLower)
        );
      }

      if (filters.startDate) {
        filteredActivities = filteredActivities.filter(
          (activity: Activity) => new Date(activity.createdAt) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        filteredActivities = filteredActivities.filter(
          (activity: Activity) => new Date(activity.createdAt) <= new Date(filters.endDate)
        );
      }

      setActivities(filteredActivities);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActivities(1);
  }, [filters, fetchActivities]);

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const columns = [
    ...(isAdmin
      ? [
          {
            header: 'User',
            accessor: (activity: Activity) => (
              <div>
                <div className="font-medium text-gray-900">{activity.user.username}</div>
                <div className="text-sm text-gray-500">{activity.user.role}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      header: 'Action',
      accessor: (activity: Activity) => (
        <span className={`px-2 py-1 text-sm rounded-full ${getActionStyle(activity.action)}`}>
          {formatAction(activity.action)}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: (activity: Activity) => {
        let summary = activity.description;
        // Remove action phrase (e.g., up to the first colon or 'for')
        // Try to remove patterns like 'Processed accommodation checkout for ', 'New guest check-in: ', etc.
        summary = summary.replace(/^(Processed accommodation checkout for |New guest check-in: |Guest check-out: |Vehicle check-out: |Admin user logged in|Staff user logged in|User created: |User updated: |User deleted: )/i, '');
        // Also remove leading/trailing whitespace and colons
        summary = summary.replace(/^[:\s]+|[:\s]+$/g, '');
        summary = truncateString(summary, 60);
        return <span title={activity.description}>{summary}</span>;
      },
    },
    {
      header: 'Date',
      accessor: (activity: Activity) => formatShortDate(new Date(activity.createdAt)),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="action" className="form-label">Activity Type Testing</label>
              <select
                id="action"
                value={filters.action}
                onChange={(e) => {
                  const select = e.target as HTMLSelectElement;
                  handleFilterChange('action', select.value);
                }}
                className="input-field"
              >
                <option value="">All Activities</option>
                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="username" className="form-label">Staff Member</label>
              <input
                type="text"
                id="username"
                value={filters.username}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  handleFilterChange('username', input.value);
                }}
                placeholder="Search by staff name"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  handleFilterChange('startDate', input.value);
                }}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  handleFilterChange('endDate', input.value);
                }}
                className="input-field"
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Activity</th>
                  <th>Staff Member</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{formatDate(activity.createdAt)}</td>
                    <td>{activity.action.replace(/_/g, ' ')}</td>
                    <td>{activity.user.username}</td>
                    <td>{truncateString(activity.description, 100)}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-primary"
              >
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-primary"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getActionStyle(action: string): string {
  const styles = {
    USER_LOGIN: 'bg-green-100 text-green-800',
    USER_LOGOUT: 'bg-gray-100 text-gray-800',
    CHECK_IN: 'bg-blue-100 text-blue-800',
    CHECK_OUT: 'bg-purple-100 text-purple-800',
    USER_CREATE: 'bg-yellow-100 text-yellow-800',
    USER_UPDATE: 'bg-orange-100 text-orange-800',
    USER_DELETE: 'bg-red-100 text-red-800',
  };

  return styles[action as keyof typeof styles] || 'bg-gray-100 text-gray-800';
}

