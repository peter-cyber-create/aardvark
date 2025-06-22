'use client';

import { ReactNode, useState, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface Column<T> {
  header: string;
  accessor: keyof T | string | ((item: T) => ReactNode);
  className?: string;
  sortable?: boolean;
}

type SortConfig = {
  key: string | number;
  direction: 'asc' | 'desc';
} | null;

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const key = sortConfig.key;
      const accessor = columns.find(col => col.accessor === key)?.accessor;
      
      if (typeof accessor === 'function') {
        const aValue = accessor(a);
        const bValue = accessor(b);
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        return aValue < bValue ? -1 * modifier : 1 * modifier;
      }

      const aValue = a[key as keyof T];
      const bValue = b[key as keyof T];
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      return aValue < bValue ? -1 * modifier : 1 * modifier;
    });
  }, [data, sortConfig, columns]);

  const handleSort = (key: string | number) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-8 text-secondary">{emptyMessage}</div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`
                  px-4 py-3 
                  bg-input-bg
                  text-sm font-medium text-secondary
                  ${column.sortable ? 'cursor-pointer hover:bg-hover' : ''}
                  ${column.className || ''}
                `}
                onClick={() => column.sortable && handleSort(column.accessor as string)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && sortConfig?.key === column.accessor && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr
              key={rowIndex}
              className="
                border-b border-border 
                hover:bg-hover 
                transition-colors
              "
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    px-4 py-3
                    text-foreground
                    ${column.className || ''}
                  `}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : typeof column.accessor === 'string'
                    ? item[column.accessor as keyof T]
                    : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
