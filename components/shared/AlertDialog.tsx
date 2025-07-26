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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-in fade-in-0 zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="flex items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isConfirm ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'} sm:mx-0 sm:h-10 sm:w-10`}>
              {isConfirm ? (
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
              ) : (
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              )}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          {isConfirm && (
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
          <button
            type="button"
            className={`mt-3 w-full inline-flex justify-center rounded-md border ${isConfirm ? 'border-gray-300 dark:border-gray-500' : 'bg-blue-600 hover:bg-blue-700 border-transparent text-white'} shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm`}
            onClick={onClose}
          >
            {isConfirm ? cancelText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}