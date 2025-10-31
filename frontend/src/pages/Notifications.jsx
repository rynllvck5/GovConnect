import React, { useMemo } from 'react';
import { getNotifications, markAllRead } from '../utils/notifications';
import { ensureUser } from '../utils/user';

export default function Notifications() {
  const user = ensureUser();
  const items = useMemo(() => getNotifications(user.name), [user.name]);

  const onMarkRead = () => {
    markAllRead(user.name);
    // naive refresh
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button onClick={onMarkRead} className="text-sm px-3 py-1.5 rounded border">Mark all read</button>
      </div>
      <div className="mt-4 space-y-3">
        {(!items || items.length === 0) && (
          <div className="text-sm text-gray-600">No notifications.</div>
        )}
        {items?.map(n => (
          <div key={n.id} className={`border rounded-md p-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
            <div className="text-xs text-gray-500">{new Date(n.ts).toLocaleString()}</div>
            <div className="text-sm text-gray-800">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
