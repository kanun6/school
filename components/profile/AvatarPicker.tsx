'use client';

import React, { useMemo, useRef, useState } from 'react';

type AvatarPickerProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  size?: number;
};

export default function AvatarPicker({
  value,
  onChange,
  disabled = false,
  size = 96,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const preview = useMemo(() => value ?? '', [value]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/avatars', { method: 'POST', body: form });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Upload failed');
      }
      const data: { url: string } = await res.json();
      onChange(data.url ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => onChange(null);

  return (
    <div className="flex flex-col gap-2 text-gray-800 dark:text-gray-100">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            preview ||
            'https://api.dicebear.com/9.x/initials/svg?seed=User&backgroundType=gradientLinear'
          }
          alt="avatar"
          style={{ width: size, height: size }}
          className="rounded-full object-cover border border-gray-300 dark:border-gray-600"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading || disabled}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || disabled}
              className="px-3 py-2 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        hidden
        disabled={uploading || disabled}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-gray-600 dark:text-gray-300">
        รองรับไฟล์รูปภาพทั่วไป (JPG/PNG/WebP) แนะนำไม่เกิน 2 MB
      </p>
    </div>
  );
}
