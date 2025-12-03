import type { DateFilter } from '../types';

export const getDateFilter = (type: DateFilter['type']): DateFilter => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate: Date;
  let endDate: Date;

  switch (type) {
    case 'today':
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;

    case 'yesterday':
      startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      endDate = new Date(today.getTime() - 1);
      break;

    case 'thisWeek':
      const dayOfWeek = today.getDay();
      startDate = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;

    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'thisQuarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      break;

    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  return {
    type,
    startDate,
    endDate,
    label: getFilterLabel(type, startDate, endDate)
  };
};

const getFilterLabel = (type: DateFilter['type'], startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };

  switch (type) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'thisWeek':
      return 'This Week';
    case 'thisMonth':
      return 'This Month';
    case 'thisQuarter':
      return 'This Quarter';
    case 'thisYear':
      return 'This Year';
    case 'custom':
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    default:
      return 'Custom Range';
  }
};

export const formatDateForFirestore = (date: Date): string => {
  return date.toISOString();
};

export const formatDateForDisplay = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDaysInRange = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const time = date.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const getStartOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getEndOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

export const getBusinessDaysInRange = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate && startDate instanceof Date && endDate instanceof Date;
};