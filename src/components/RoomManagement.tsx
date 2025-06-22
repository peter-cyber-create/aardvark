'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { DataTable } from './DataTable';
import { InputField } from './InputField';
import { Card } from './Card';
import { fetchApi } from '@/lib/api-utils';
import { formatShortDate } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'react-hot-toast';

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  status: RoomStatus;
  pricePerNight: number;
}

type RoomStatus = 'VACANT' | 'OCCUPIED' | 'NEEDS_CLEANING' | 'UNDER_MAINTENANCE';
type AllowedStatus = Exclude<RoomStatus, 'OCCUPIED'>;

export default function RoomManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomType: 'STANDARD',
    pricePerNight: 0,
  });
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';
  const isStaff = session?.user?.role === 'STAFF';
  const [searchQuery, setSearchQuery] = useState('');
  const [roomManagementSuccess, setRoomManagementSuccess] = useState('');
  const { isOnline } = useOfflineSync();

  const fetchRooms = useCallback(async () => {
    if (!session?.user) return; // Don't fetch if no session
    setIsLoading(true);
    try {
      const response = await fetchApi<Room[]>('/api/rooms', {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setRooms(response.data);
        setError('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      if (message.includes('Unauthorized')) {
        // Handle unauthorized without redirecting
        setError('Session expired. Please refresh the page.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchRooms();
    }
  }, [fetchRooms, session]);

  const handleDelete = async (roomId: string) => {
    const shouldDelete = typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this room?');
    if (!shouldDelete) return;

    try {
      await fetchApi(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      setRoomManagementSuccess('Room deleted successfully!');
      setTimeout(() => setRoomManagementSuccess(''), 5000);
      await fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room');
      setRoomManagementSuccess('');
    }
  };

  const handleCreate = async () => {
    try {
      await fetchApi('/api/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom),
      });
      
      setRoomManagementSuccess('Room created successfully!');
      setTimeout(() => setRoomManagementSuccess(''), 5000);
      setNewRoom({
        roomNumber: '',
        roomType: 'STANDARD',
        pricePerNight: 0,
      });
      setShowNewRoomForm(false);
      await fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
      setRoomManagementSuccess('');
    }
  };

  const handleUpdate = async (roomId: string, data: Partial<Room>) => {
    if (!isAdmin) return;

    try {
      await fetchApi(`/api/rooms/${roomId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      setRoomManagementSuccess('Room updated successfully!');
      setTimeout(() => setRoomManagementSuccess(''), 5000);
      setEditingRoom(null);
      await fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      setError('Failed to update room');
      setRoomManagementSuccess('');
    }
  };

  const handleUpdateStatus = async (roomId: string, newStatus: AllowedStatus) => {
    setIsLoading(true);
    setError('');
    try {
      await fetchApi(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      
      setRoomManagementSuccess('Room status updated successfully!');
      setTimeout(() => setRoomManagementSuccess(''), 5000);
      setRooms(currentRooms => 
        currentRooms.map(room => 
          room.id === roomId ? { ...room, status: newStatus } : room
        )
      );
    } catch (error) {
      console.error('Error updating room status:', error);
      setError('Failed to update room status');
      setRoomManagementSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (event: SelectChangeEvent, room: Room) => {
    const select = event.currentTarget;
    const selectedStatus = select.value as AllowedStatus;
    
    if (isAdmin && editingRoom?.id === room.id) {
      setEditingRoom({ ...editingRoom, status: selectedStatus });
    } else {
      handleUpdateStatus(room.id, selectedStatus);
    }
  };

  const handleInputChange = (event: InputChangeEvent | SelectChangeEvent, field: keyof Room) => {
    if (!editingRoom) return;
    
    const input = event.currentTarget;
    let updatedValue: string | number;
    
    if ('type' in input && input.type === 'number') {
      updatedValue = parseFloat(input.value) || 0;
    } else {
      updatedValue = input.value;
    }
    
    setEditingRoom(current => ({
      ...current!,
      [field]: updatedValue,
    }));
  };

  const handleNewRoomInputChange = (event: InputChangeEvent | SelectChangeEvent, field: keyof typeof newRoom) => {
    const input = event.currentTarget;
    let updatedValue: string | number;
    
    if ('type' in input && input.type === 'number') {
      updatedValue = parseFloat(input.value) || 0;
    } else {
      updatedValue = input.value;
    }
    
    setNewRoom(current => ({
      ...current,
      [field]: updatedValue,
    }));
  };

  const columns = [
    {
      header: 'Room Number',
      accessor: (room: Room) => (
        isAdmin && editingRoom?.id === room.id ? (
          <div className="flex flex-col space-y-2">
            <label htmlFor={`roomNumber-${room.id}`} className="text-xs font-medium text-gray-500">Room Number</label>
            <InputField
              id={`roomNumber-${room.id}`}
              value={editingRoom.roomNumber}
              onChange={(e) => handleInputChange(e, 'roomNumber')}
              label=""
            />
          </div>
        ) : (
          room.roomNumber
        )
      ),
    },
    {
      header: 'Type',
      accessor: (room: Room) => (
        isAdmin && editingRoom?.id === room.id ? (
          <div className="relative flex flex-col space-y-2">
            <label htmlFor={`roomType-${room.id}`} className="text-xs font-medium text-gray-500">Type</label>
            <select
              id={`roomType-${room.id}`}
              value={editingRoom.roomType}
              onChange={(e) => handleInputChange(e, 'roomType')}
              className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="STANDARD">Standard</option>
              <option value="DELUXE">Deluxe</option>
              <option value="SUITE">Suite</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          room.roomType
        )
      ),
    },
    {
      header: 'Price/Night',
      accessor: (room: Room) => (
        isAdmin && editingRoom?.id === room.id ? (
          <div className="flex flex-col space-y-2">
            <label htmlFor={`pricePerNight-${room.id}`} className="text-xs font-medium text-gray-500">Price/Night</label>
            <InputField
              id={`pricePerNight-${room.id}`}
              type="number"
              value={editingRoom.pricePerNight.toString()}
              onChange={(e) => handleInputChange(e, 'pricePerNight')}
              label=""
            />
          </div>
        ) : (
          `UGX ${room.pricePerNight.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        )
      ),
    },
    {
      header: 'Status',
      accessor: (room: Room) => (
        isStaff || (isAdmin && editingRoom?.id === room.id) ? (
          <div className="relative w-fit min-w-[150px]">
            {!(isAdmin && editingRoom?.id === room.id) && <label htmlFor={`status-${room.id}`} className="sr-only">Status</label>}
            <select
              id={`status-${room.id}`}
              value={isAdmin && editingRoom?.id === room.id ? editingRoom.status : room.status}
              onChange={(e) => handleStatusChange(e, room)}
              className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-1 px-2 pr-7 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              disabled={isAdmin && editingRoom?.id !== room.id}
            >
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="NEEDS_CLEANING">Needs Cleaning</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            room.status === 'VACANT' ? 'bg-green-100 text-green-800' :
            room.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
            room.status === 'NEEDS_CLEANING' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {room.status}
          </span>
        )
      ),
    },
    {
      header: 'Actions',
      accessor: (room: Room) => (
        isAdmin ? (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {editingRoom?.id === room.id ? (
              <>
                <Button
                  onClick={() => handleUpdate(room.id, editingRoom)}
                  className="bg-green-600 hover:bg-green-700 text-xs py-1 px-2"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setEditingRoom(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-xs py-1 px-2"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setEditingRoom(room)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(room.id)}
                  className="bg-red-600 hover:bg-red-700 text-xs py-1 px-2"
                  disabled={room.status === 'OCCUPIED'}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        ) : null
      ),
    },
  ];

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <Card>
        <div className="p-6 text-center text-red-500">You do not have permission to view Room Management.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Room Management</h2>
          {isAdmin && (
            <Button 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" 
              onClick={() => setShowNewRoomForm((v) => !v)}
            >
              {showNewRoomForm ? 'Cancel' : 'Add New Room'}
            </Button>
          )}
        </div>

        <InputField
          placeholder="Search rooms by number or type"
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          label=""
          className="w-full"
        />

        {showNewRoomForm && isAdmin && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Room</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Room Number"
                value={newRoom.roomNumber}
                onChange={(e) => handleNewRoomInputChange(e, 'roomNumber')}
                required
                className="w-full"
              />
              <div className="relative w-full">
                <label htmlFor="newRoomType" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  id="newRoomType"
                  value={newRoom.roomType}
                  onChange={(e) => handleNewRoomInputChange(e, 'roomType')}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="STANDARD">Standard</option>
                  <option value="DELUXE">Deluxe</option>
                  <option value="SUITE">Suite</option>
                </select>
              </div>
              <InputField
                label="Price per Night"
                type="number"
                value={newRoom.pricePerNight.toString()}
                onChange={(e) => handleNewRoomInputChange(e, 'pricePerNight')}
                required
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowNewRoomForm(false)}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                Create Room
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {roomManagementSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-200 rounded">
            {roomManagementSuccess}
          </div>
        )}

        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={rooms}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Card>
  );
}
