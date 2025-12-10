import React from 'react';
import { createPortal } from 'react-dom';

const variants = {
  success: {
    bg: 'bg-green-50',
    ring: 'ring-green-200',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    title: 'text-green-800',
    btn: 'bg-green-600 hover:bg-green-700 text-white',
  },
  error: {
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    title: 'text-red-800',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    title: 'text-amber-800',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    title: 'text-slate-800',
    btn: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  confirm: {
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    title: 'text-slate-800',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

function Icon({ type }) {
  const cls = variants[type] || variants.info;
  if (type === 'success') return (
    <div className={`shrink-0 ${cls.iconBg} ${cls.iconText} rounded-full p-2`}>✓</div>
  );
  if (type === 'error') return (
    <div className={`shrink-0 ${cls.iconBg} ${cls.iconText} rounded-full p-2`}>!</div>
  );
  if (type === 'warning') return (
    <div className={`shrink-0 ${cls.iconBg} ${cls.iconText} rounded-full p-2`}>!</div>
  );
  return (
    <div className={`shrink-0 ${cls.iconBg} ${cls.iconText} rounded-full p-2`}>i</div>
  );
}

export default function MessageModal({ open, onClose, type = 'info', title, message, description, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, showCancel = false }) {
  if (!open) return null;
  const cls = variants[type] || variants.info;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full max-w-md ${cls.bg} rounded-xl shadow-2xl ring-1 ${cls.ring} overflow-hidden`} onClick={(e)=>e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className={`text-base font-semibold ${cls.title}`}>{title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information')}</div>
            <button onClick={onClose} className="w-8 h-8 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">✕</button>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <Icon type={type} />
              <div>
                {message && <div className="text-sm text-gray-800">{message}</div>}
                {description && <div className="mt-1 text-xs text-gray-600">{description}</div>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              {showCancel && (
                <button onClick={onClose} className="px-4 py-2 rounded-md border">{cancelLabel}</button>
              )}
              <button onClick={onConfirm || onClose} className={`px-4 py-2 rounded-md ${cls.btn}`}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
