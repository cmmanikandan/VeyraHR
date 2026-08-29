import { AttendanceRecord } from '../types/database';

export interface OfflineAttendanceItem {
  id: string;
  employee_id: string;
  employee_name: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  location?: string;
  verification_method: string;
}

const STORAGE_KEY = 'veyra_offline_attendance_queue';

export const getOfflineQueue = (): OfflineAttendanceItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading offline attendance queue:', err);
    return [];
  }
};

export const enqueueOfflineAttendance = (item: Omit<OfflineAttendanceItem, 'id'>): OfflineAttendanceItem => {
  const queue = getOfflineQueue();
  const newItem: OfflineAttendanceItem = {
    ...item,
    id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
  };
  queue.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return newItem;
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const processOfflineQueue = async (
  onProcessItem: (item: OfflineAttendanceItem) => Promise<boolean>
): Promise<number> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  const remaining: OfflineAttendanceItem[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      const success = await onProcessItem(item);
      if (success) {
        processedCount++;
      } else {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return processedCount;
};
