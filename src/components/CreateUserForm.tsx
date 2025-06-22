'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { InputField } from './InputField';

export default function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'STAFF',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      setSuccess('User created successfully!');
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'STAFF',
      });
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New User</h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-500 p-4 rounded-lg flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        )}

        <InputField
          label="Email"
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="user@example.com"
        />

        <InputField
          label="Username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="johndoe"
        />

        <InputField
          label="Password"
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="••••••••"
        />

        <div className="mb-4">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading && <LoadingSpinner size="sm" color="#ffffff" />}
          <span>{loading ? 'Creating User...' : 'Create User'}</span>
        </button>
      </form>
    </div>
  );
}
