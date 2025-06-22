import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat('en-US', options || defaultOptions)
    .format(typeof date === 'string' ? new Date(date) : date);
};

export const formatShortDate = (date: Date | string) => {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'UGX 0.00';
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateDuration = (startDate: Date | string, endDate: Date | string) => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
};

export const truncateString = (str: string, length: number = 50) => {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

export const generateTimeSlots = (interval: number = 30) => {
  const slots = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  while (slots.length < (24 * 60) / interval) {
    slots.push(new Date(now));
    now.setMinutes(now.getMinutes() + interval);
  }

  return slots;
};

export const slugify = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phoneNumber: string) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
};
