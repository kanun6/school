'use client';

import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
}: AlertDialogProps) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  // สีหลัก: confirm = แดง, alert = น้ำเงิน
  const primaryIconWrap = isConfirm
    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';

  const primaryBtn = isConfirm
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400'
    : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-xl transform transition-all animate-in fade-in-0 zoom-in-95">
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* เนื้อหา */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${primaryIconWrap}`}
              aria-hidden="true"
            >
              {isConfirm ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <CheckCircle className="h-6 w-6" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* แถบปุ่ม */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-xl bg-gray-50 dark:bg-gray-900 flex gap-3 justify-end">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={onConfirm}
                className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${primaryBtn}`}
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                {cancelText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${primaryBtn}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
