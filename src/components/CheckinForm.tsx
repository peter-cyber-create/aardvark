'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';
import { AGE_BRACKETS, COTTAGES } from '@/lib/validations/checkin';
import type { CheckinFormData } from '@/lib/validations/checkin';
import { toast } from 'react-hot-toast';

const initialFormData: CheckinFormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  tourCompany: '',
  otherInfo: '',
  cottageType: 'SINGLE',
  cottageNumber: COTTAGES[0],
  numChildren: 0,
  childrenAges: [],
  guestNames: [],
  checkInDate: '',
  checkInTime: ''
};

export default function CheckInForm({ roomId: initialRoomId }: { roomId?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<CheckinFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = target.name || '';
    const value = target.value || '';
    if (name === 'numChildren') {
      const numChildren = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numChildren,
        childrenAges: prev.childrenAges.slice(0, numChildren)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuestNameChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      guestNames: prev.guestNames.map((guest, i) => 
        i === index ? { name: value } : guest
      )
    }));
  };

  const addGuestName = () => {
    setFormData(prev => ({
      ...prev,
      guestNames: [...prev.guestNames, { name: '' }]
    }));
  };

  const removeGuestName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      guestNames: prev.guestNames.filter((_, i) => i !== index)
    }));
  };

  const handleChildAgeChange = (index: number, value: string) => {
    const validValue = value as typeof AGE_BRACKETS[number];
    if (AGE_BRACKETS.includes(validValue)) {
      setFormData(prev => ({
        ...prev,
        childrenAges: [
          ...prev.childrenAges.slice(0, index),
          validValue,
          ...prev.childrenAges.slice(index + 1)
        ]
      }));
    }
  };

  const renderChildAgeSelectors = () => {
    if (formData.numChildren === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className="form-section-subtitle">Children's Age Brackets</h4>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: formData.numChildren }).map((_, index) => (
            <div key={index} className="form-group">
              <label className="form-label required">
                Child {index + 1} Age Bracket
              </label>
              <select
                value={formData.childrenAges[index] || ''}
                onChange={(e) => handleChildAgeChange(index, e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select age bracket</option>
                {AGE_BRACKETS.map((bracket) => (
                  <option key={bracket} value={bracket}>
                    {bracket}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      toast.error('Please enter the primary guest name');
      return false;
    }
    
    if (!formData.clientPhone && !formData.clientEmail) {
      toast.error('Please provide either a phone number or email address');
      return false;
    }

    if (!formData.checkInDate || !formData.checkInTime) {
      toast.error('Please select check-in date and time');
      return false;
    }

    if (!formData.cottageNumber) {
      toast.error('Please select a cottage');
      return false;
    }

    if (formData.numChildren > 0 && formData.childrenAges.length < formData.numChildren) {
      toast.error('Please select age brackets for all children');
      return false;
    }

    // Validate guest names
    if (formData.guestNames.some(guest => !guest.name.trim())) {
      toast.error('Please fill in all guest names or remove empty entries');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to process check-in');
      }
      
      toast.success('Check-in completed successfully.');
      setFormData(initialFormData);
      router.push('/dashboard/checkins');
      router.refresh();
    } catch (error) {
      toast.error('Failed to process check-in');
      console.error('Check-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currentDate = new Date().toLocaleDateString();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Check-in Form - ${formData.clientName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #333;
                margin: 0;
              }
              .section {
                margin-bottom: 20px;
              }
              .signature-box {
                margin-top: 50px;
                border-top: 1px solid #000;
                padding-top: 10px;
                display: flex;
                justify-content: space-between;
              }
              .signature-line {
                width: 45%;
              }
              .signature-label {
                font-size: 12px;
                margin-top: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              td {
                padding: 8px;
                border: 1px solid #ddd;
              }
              td:first-child {
                font-weight: bold;
                width: 200px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AARDVARK SAFARI LODGE</h1>
              <p>Guest Check-in Form</p>
              <p>Date: ${currentDate}</p>
            </div>

            <div class="section">
              <table>
                <tr>
                  <td>Primary Guest:</td>
                  <td>${formData.clientName}</td>
                </tr>
                <tr>
                  <td>Additional Guests:</td>
                  <td>${formData.guestNames.map(g => g.name).join(', ') || 'None'}</td>
                </tr>
                <tr>
                  <td>Contact:</td>
                  <td>
                    ${formData.clientPhone ? `Phone: ${formData.clientPhone}` : ''}
                    ${formData.clientPhone && formData.clientEmail ? '<br>' : ''}
                    ${formData.clientEmail ? `Email: ${formData.clientEmail}` : ''}
                  </td>
                </tr>
                <tr>
                  <td>Tour Company:</td>
                  <td>${formData.tourCompany || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Cottage Details:</td>
                  <td>Type: ${formData.cottageType}<br>Number: ${formData.cottageNumber}</td>
                </tr>
                <tr>
                  <td>Children:</td>
                  <td>
                    Number of Children: ${formData.numChildren}<br>
                    ${formData.numChildren > 0 ? `Age Brackets: ${formData.childrenAges.join(', ')}` : ''}
                  </td>
                </tr>
                <tr>
                  <td>Check-in Time:</td>
                  <td>Date: ${formData.checkInDate}<br>Time: ${formData.checkInTime}</td>
                </tr>
                ${formData.otherInfo ? `
                <tr>
                  <td>Additional Information:</td>
                  <td>${formData.otherInfo}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div class="signature-box">
              <div class="signature-line">
                <div style="min-height: 40px;"></div>
                <div class="signature-label">Guest Signature</div>
              </div>
              <div class="signature-line">
                <div style="min-height: 40px;"></div>
                <div class="signature-label">Staff Signature</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Pre-fill date and time on initial load
  useEffect(() => {
    if (!formData.checkInDate || !formData.checkInTime) {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0].substring(0, 5);
      setFormData(prev => ({
        ...prev,
        checkInDate: date,
        checkInTime: time,
      }));
    }
  }, [formData.checkInDate, formData.checkInTime]);

  if (!session?.user) {
    return <div>Access denied</div>;
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="form-section-header">
          <h2 className="form-section-title">Guest Check-in Form</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please fill in all required information to check in a new guest.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            {/* Client Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Client Information</h3>
              </div>
              <div className="form-section-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="clientName" className="form-label required">
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="clientPhone" className="form-label required">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="clientPhone"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="clientEmail" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tourCompany" className="form-label">
                      Tour Company
                    </label>
                    <input
                      type="text"
                      id="tourCompany"
                      name="tourCompany"
                      value={formData.tourCompany}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cottage Details Section */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Cottage Details</h3>
              </div>
              <div className="form-section-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="cottageType" className="form-label required">
                      Cottage Type
                    </label>
                    <select
                      id="cottageType"
                      name="cottageType"
                      value={formData.cottageType}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="SINGLE">Single</option>
                      <option value="DOUBLE">Double</option>
                      <option value="FAMILY">Family</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cottageNumber" className="form-label required">
                      Cottage Number
                    </label>
                    <select
                      id="cottageNumber"
                      name="cottageNumber"
                      value={formData.cottageNumber}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      {COTTAGES.map(cottage => (
                        <option key={cottage} value={cottage}>
                          {cottage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkInDate" className="form-label required">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      id="checkInDate"
                      name="checkInDate"
                      value={formData.checkInDate}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkInTime" className="form-label required">
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      id="checkInTime"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Guests Section */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Additional Guests</h3>
              </div>
              <div className="form-section-content">
                <div className="space-y-4">
                  {formData.guestNames.map((guest, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={guest.name}
                          onChange={(e) => handleGuestNameChange(index, e.target.value)}
                          placeholder={`Guest ${index + 1} Name`}
                          className="input-field"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGuestName(index)}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addGuestName}
                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    + Add Guest
                  </button>
                </div>
              </div>
            </div>

            {/* Children Section */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Children</h3>
              </div>
              <div className="form-section-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="numChildren" className="form-label">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      id="numChildren"
                      name="numChildren"
                      min="0"
                      value={formData.numChildren}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  {formData.numChildren > 0 && (
                    <div className="col-span-2">
                      <label className="form-label">Age Brackets</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: formData.numChildren }).map((_, index) => (
                          <select
                            key={index}
                            value={formData.childrenAges[index] || ''}
                            onChange={(e) => handleChildAgeChange(index, e.target.value)}
                            className="input-field"
                            required
                          >
                            <option value="">Select age bracket</option>
                            {AGE_BRACKETS.map(bracket => (
                              <option key={bracket} value={bracket}>
                                {bracket}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {renderChildAgeSelectors()}
              </div>
            </div>

            {/* Other Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Other Information</h3>
              </div>
              <div className="form-section-content">
                <div className="form-group">
                  <label htmlFor="otherInfo" className="form-label">
                    Additional Information
                  </label>
                  <textarea
                    id="otherInfo"
                    name="otherInfo"
                    value={formData.otherInfo}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Print
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {isLoading ? <LoadingSpinner /> : 'Submit Check-in'}
              </button>
            </div>
          </Card>
        </form>
      </div>
    </Card>
  );
}

