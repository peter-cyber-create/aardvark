'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api-utils';
import { Card } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';

interface Accommodation {
  id: string;
  roomNumber: string;
  roomType: string;
  status: 'VACANT' | 'OCCUPIED';
  pricePerNight: number;
}

interface Checkin {
  id: string;
  guestName: string;
  status: 'ACTIVE' | 'CHECKED_OUT';
  checkInDateTime: string;
  checkOutDateTime?: string;
  totalCost?: number;
  accommodation?: Accommodation;
  accommodationId?: string;
  serviceType: string;
  clientPhone?: string;
  vehicleNumber?: string;
  driverName?: string;
  user?: {
    username: string;
  };
}

function getCheckinDuration(checkin: Checkin) {
  const start = new Date(checkin.checkInDateTime);
  const end = checkin.status === 'CHECKED_OUT' && checkin.checkOutDateTime ? new Date(checkin.checkOutDateTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  if (hours < 1) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (session?.user?.role === 'STAFF') {
      fetchCheckins();
    }
  }, [session]);

  if (!session?.user || session.user.role !== 'STAFF') {
    return (
      <Card>
        <div className="p-6 text-center text-red-500">You do not have permission to access Checkouts.</div>
      </Card>
    );
  }

  const fetchCheckins = async () => {
    setIsLoading(true);
    try {
      // Fetch only active check-ins for checkout
      const response = await fetch('/api/checkins?status=ACTIVE');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active check-ins');
      }

      setCheckins(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (id: string) => {
    const checkin = checkins.find(c => c.id === id);
    if (!checkin) return;

    setSelectedCheckin(checkin);
    setShowConfirmModal(true);
    setShowSignaturePad(true);

    // Calculate cost based on duration
    if (checkin.serviceType === 'ACCOMMODATION' && checkin.accommodation) {
      const duration = calculateDuration(checkin);
      const cost = Math.ceil(duration.hours / 24) * checkin.accommodation.pricePerNight;
      setCalculatedCost(cost);
    }
  };

  const calculateDuration = (checkin: Checkin) => {
    const start = new Date(checkin.checkInDateTime);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    return { hours, minutes };
  };

  const clearSignature = () => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const completeCheckout = async () => {
    if (!selectedCheckin) return;

    setIsProcessing(true);
    try {
      const canvas = signaturePadRef.current;
      const signature = canvas?.toDataURL() || '';

      const response = await fetch(`/api/checkins/${selectedCheckin.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalCost: calculatedCost,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process checkout');
      }

      // Refresh the checkins list
      await fetchCheckins();
      setShowConfirmModal(false);
      setSelectedCheckin(null);
      setCalculatedCost(null);
      clearSignature();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCheckins = searchQuery
    ? checkins.filter(checkin => 
        checkin.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        checkin.accommodation?.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : checkins;

  // Define columns for the DataTable
  const columns = [
    {
      header: 'Guest Info',
      accessor: (row: Checkin) => row.guestName,
      cell: ({ row }: { row: Checkin }) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.guestName}</div>
          {row.clientPhone && (
            <div className="text-sm text-secondary">{row.clientPhone}</div>
          )}
          {row.serviceType === 'PARKING' && row.vehicleNumber && (
            <div className="text-sm text-secondary">
              Vehicle: {row.vehicleNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Room/Space',
      accessor: (row: Checkin) => row.accommodation?.roomNumber || 'Parking',
      cell: ({ row }: { row: Checkin }) => (
        <div className="space-y-1">
          {row.accommodation ? (
            <>
              <div className="font-medium text-foreground">
                {row.accommodation.roomNumber}
              </div>
              <div className="text-sm text-secondary">
                {row.accommodation.roomType}
              </div>
            </>
          ) : (
            <div className="text-secondary">Parking Space</div>
          )}
        </div>
      ),
    },
    {
      header: 'Check-in Time',
      accessor: (row: Checkin) => row.checkInDateTime,
      cell: ({ row }: { row: Checkin }) => (
        <div className="space-y-1">
          <div className="text-foreground">
            {new Date(row.checkInDateTime).toLocaleTimeString()}
          </div>
          <div className="text-sm text-secondary">
            {formatShortDate(row.checkInDateTime)}
          </div>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: (row: Checkin) => getCheckinDuration(row),
      cell: ({ row }: { row: Checkin }) => (
        <div className="text-foreground">{getCheckinDuration(row)}</div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Checkin) => row.id,
      cell: ({ row }: { row: Checkin }) => (
        <button
          onClick={() => handleCheckout(row.id)}
          disabled={isCheckingOut}
          className="btn-primary"
        >
          {isCheckingOut ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
              <span>Processing...</span>
            </div>
          ) : (
            'Checkout'
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Active Check-ins</h1>
          <div className="w-full sm:w-auto">
            <InputField
              type="search"
              placeholder="Search by guest name or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {error ? (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            {error}
          </div>
        ) : null}

        <DataTable
          data={filteredCheckins}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No active check-ins found"
        />
      </Card>

      {showConfirmModal && selectedCheckin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Confirm Checkout</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Guest Name
                </label>
                <div className="text-foreground">
                  {selectedCheckin.guestName}
                </div>
              </div>

              {selectedCheckin.accommodation && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Room
                  </label>
                  <div className="text-foreground">
                    {selectedCheckin.accommodation.roomNumber}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Duration
                </label>
                <div className="text-foreground">
                  {getCheckinDuration(selectedCheckin)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Total Cost
                </label>
                <div className="text-foreground text-xl font-semibold">
                  {formatCurrency(calculatedCost || 0)}
                </div>
              </div>

              {showSignaturePad && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Signature
                  </label>
                  <div className="border border-border rounded-md overflow-hidden">
                    <canvas
                      ref={signaturePadRef}
                      className="w-full h-48 bg-input-bg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 text-sm text-secondary hover:text-primary"
                  >
                    Clear Signature
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-border text-secondary rounded hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={completeCheckout}
                disabled={isProcessing}
                className="btn-primary"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Complete Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}