/**
 * VeyraHR Web Push & Notification Service
 * Manages browser push permissions, daily attendance reminders, and leave status updates.
 */

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Requests browser notification permission if not yet decided
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch (error) {
    console.warn('Notification permission error:', error);
    return false;
  }
};

/**
 * Displays a rich browser notification using Service Worker or fallback Notification API
 * and persists the notification into local app inbox
 */
export const triggerAppNotification = async (payload: NotificationPayload): Promise<void> => {
  // 1. Persist notification to app's in-app inbox storage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('veyra_notifications');
      const list = saved ? JSON.parse(saved) : [];
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipient_profile_id: 'all',
        title: payload.title,
        message: payload.body,
        type: 'System',
        created_at: new Date().toISOString(),
        is_read: false,
        link_url: payload.url || '/employee/attendance',
      };
      const updated = [newNotif, ...list];
      localStorage.setItem('veyra_notifications', JSON.stringify(updated.slice(0, 100)));
      window.dispatchEvent(new CustomEvent('veyra_notifications_updated'));
    } catch {}
  }

  // 2. Push Native OS / Mobile Web notification
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const isGranted = await requestNotificationPermission();
  if (!isGranted) return;

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.tag || `veyra-notif-${Date.now()}`,
    data: { url: payload.url || '/' },
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, options);
    } else {
      const notif = new Notification(payload.title, options);
      notif.onclick = () => {
        window.focus();
        if (payload.url) window.location.href = payload.url;
        notif.close();
      };
    }
  } catch (error) {
    console.warn('Push notification delivery notice:', error);
  }
};

/**
 * Helper to dispatch attendance check-in reminder
 */
export const sendAttendanceReminderNotification = (type: 'check_in' | 'check_out'): void => {
  if (type === 'check_in') {
    triggerAppNotification({
      title: '⏰ Morning Check-In Reminder',
      body: 'Good morning! Please scan the QR code or use 1-tap GPS check-in to record your attendance.',
      url: '/employee/attendance',
      tag: 'checkin-reminder',
    });
  } else {
    triggerAppNotification({
      title: '🏢 Shift Wrap-Up Reminder',
      body: 'Your work hours are complete for today. Don’t forget to check out before heading home!',
      url: '/employee/attendance',
      tag: 'checkout-reminder',
    });
  }
};

/**
 * Helper to dispatch leave request status update
 */
export const sendLeaveStatusNotification = (
  employeeName: string,
  leaveType: string,
  status: 'Approved' | 'Rejected'
): void => {
  const isApproved = status === 'Approved';
  triggerAppNotification({
    title: isApproved ? '🎉 Leave Request Approved' : '⚠️ Leave Request Update',
    body: isApproved
      ? `Hello ${employeeName}, your ${leaveType} request has been approved by HR.`
      : `Hello ${employeeName}, your ${leaveType} request was not approved. Please consult HR.`,
    url: '/employee/leave',
    tag: 'leave-status',
  });
};

/**
 * Helper to dispatch Geofence Entry & Exit push notifications
 */
export const sendGeofenceBoundaryNotification = (
  branchName: string,
  event: 'entered' | 'exited'
): void => {
  if (event === 'entered') {
    triggerAppNotification({
      title: `📍 Entered Workplace Boundary: ${branchName}`,
      body: `You are inside the ${branchName} boundary perimeter. Ready for 1-Tap Check-In!`,
      url: '/employee/attendance',
      tag: 'geofence-boundary-entered',
    });
  } else {
    triggerAppNotification({
      title: `📍 Exited Workplace Boundary: ${branchName}`,
      body: `You stepped outside ${branchName} perimeter. Don't forget to check out if finished for today.`,
      url: '/employee/attendance',
      tag: 'geofence-boundary-exited',
    });
  }
};
