'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { DataTable } from './DataTable';
import { InputField } from './InputField';
import { Card } from './Card';
import { fetchApi } from '@/lib/api-utils';
import { useSession } from 'next-auth/react';
import { userRegistrationSchema } from '@/lib/validations/user';
import { z } from 'zod';
import { userUpdateSchema } from '@/lib/validations/user';
import { formatShortDate } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
  password?: string;
}

export default function UserManagement() {
  const { data: session, status: sessionStatus } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STAFF',
  });
  const [createFormErrors, setCreateFormErrors] = useState<z.ZodIssue[]>([]);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [editFormErrors, setEditFormErrors] = useState<z.ZodIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const response = await fetchApi<User[]>(`/api/users?search=${searchQuery}`);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setUsers(response.data);
    }
    setIsLoading(false);
  }, [searchQuery, sessionStatus]);

  const fetchActivities = useCallback(async (page: number) => {
    // ... function body ...
  }, []); // Ensure filters is listed as a dependency here

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUsers();
    }
    if (sessionStatus !== 'loading') {
      setIsLoading(false);
    }
    // fetchActivities(1); // Remove or handle pagination/filtering for activities separately
  }, [sessionStatus, fetchUsers]); // Keep relevant dependencies

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    const response = await fetchApi(`/api/users?id=${userId}`, {
      method: 'DELETE',
    });

    if (response.error) {
      setError(response.error);
    } else {
      await fetchUsers();
    }
  };

  const handleUpdate = async (userId: string, data: Partial<User>) => {
    setEditFormErrors([]);

    const validationResult = userUpdateSchema.safeParse({ id: userId, ...data });

    if (!validationResult.success) {
      setEditFormErrors(validationResult.error.errors);
      return;
    }

    const validatedData = validationResult.data;

    const response = await fetchApi('/api/users', {
      method: 'PATCH',
      body: JSON.stringify(validatedData),
    });

    if (response.error) {
      setError(response.error);
    } else {
      setEditingUser(null);
      await fetchUsers();
    }
  };

  const columns = [
    {
      header: 'Username',
      accessor: (user: User) => (
        editingUser?.id === user.id ? (
          <>
            <InputField
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} label={''}            />
            {editFormErrors.find(err => err.path[0] === 'username') && (
              <p className="text-red-500 text-sm mt-1">{editFormErrors.find(err => err.path[0] === 'username')?.message}</p>
            )}
          </>
        ) : (
          <span className="font-medium text-gray-900">{user.username}</span>
        )
      ),
    },
    {
      header: 'Email',
      accessor: (user: User) => (
        editingUser?.id === user.id ? (
          <>
            <InputField
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} label={''}            />
            {editFormErrors.find(err => err.path[0] === 'email') && (
              <p className="text-red-500 text-sm mt-1">{editFormErrors.find(err => err.path[0] === 'email')?.message}</p>
            )}
          </>
        ) : (
          user.email
        )
      ),
    },
    {
      header: 'Role',
      accessor: (user: User) => (
        editingUser?.id === user.id ? (
          <>
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'ADMIN' | 'STAFF' })}
              className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
            {editFormErrors.find(err => err.path[0] === 'role') && (
              <p className="text-red-500 text-sm mt-1">{editFormErrors.find(err => err.path[0] === 'role')?.message}</p>
            )}
          </>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role}
          </span>
        )
      ),
    },
    {
      header: 'Actions',
      accessor: (user: User) => (
        session?.user?.role === 'ADMIN' ? (
          <div className="flex space-x-2">
            {editingUser?.id === user.id ? (
              <>
                <InputField
                  type="password"
                  placeholder="New Password (leave blank to keep)"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  label={''}
                />
                {editFormErrors.find(err => err.path[0] === 'password') && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.find(err => err.path[0] === 'password')?.message}</p>
                )}
                <Button
                  onClick={() => handleUpdate(user.id, editingUser)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setEditingUser(user)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-600 hover:bg-red-700"
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

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Loading user data...</div>
      </Card>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <Card>
        <div className="p-6 text-center text-red-500">You need to be logged in to view this page.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
          {(session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Cancel' : 'Create New User'}
            </Button>
          )}
        </div>

        <InputField
          placeholder="Search users by username or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          label=""
        />

        {showCreate && (
          <form
            className="bg-gray-50 p-4 rounded-lg space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateError('');
              setCreateSuccess('');
              setCreateFormErrors([]);

              const validationResult = userRegistrationSchema.safeParse(createForm);

              if (!validationResult.success) {
                setCreateFormErrors(validationResult.error.errors);
                return;
              }

              const validatedData = validationResult.data;

              const response = await fetchApi('/api/users', {
                method: 'POST',
                body: JSON.stringify(validatedData),
              });
              if (response.error) {
                setCreateError(response.error);
              } else {
                setCreateSuccess('User created successfully!');
                setCreateForm({ username: '', email: '', password: '', role: 'STAFF' });
                setShowCreate(false);
                fetchUsers();
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField
                label="Username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
              />
              {createFormErrors.find(err => err.path[0] === 'username') && (
                <p className="text-red-500 text-sm mt-1">{createFormErrors.find(err => err.path[0] === 'username')?.message}</p>
              )}
              <InputField
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
              {createFormErrors.find(err => err.path[0] === 'email') && (
                <p className="text-red-500 text-sm mt-1">{createFormErrors.find(err => err.path[0] === 'email')?.message}</p>
              )}
              <InputField
                label="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
              {createFormErrors.find(err => err.path[0] === 'password') && (
                <p className="text-red-500 text-sm mt-1">{createFormErrors.find(err => err.path[0] === 'password')?.message}</p>
              )}
              <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            {createError && <div className="text-red-500 text-sm mt-2">{createError}</div>}
            {createSuccess && <div className="text-green-600 text-sm mt-2">{createSuccess}</div>}
            <div className="flex justify-end">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Create User</Button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}
