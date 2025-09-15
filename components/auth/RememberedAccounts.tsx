'use client';

import { useEffect, useState, KeyboardEvent, MouseEvent } from 'react';
import { X } from 'lucide-react';
import { RememberedAccount, loadAccounts, removeAccount } from '@/lib/remembered-accounts';

export default function RememberedAccounts({
  onSelect,
}: {
  onSelect: (acc: RememberedAccount) => void;
}) {
  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  const handleRemove = (id: string, e?: MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    removeAccount(id);
    setAccounts(loadAccounts());
  };

  const handleKeyDown =
    (acc: RememberedAccount) =>
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(acc);
      }
    };

  if (accounts.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
        เข้าสู่ระบบอย่างรวดเร็ว
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {accounts.map((acc) => {
          const name = acc.name?.trim() || acc.email;
          const showEmail = acc.email && acc.email !== name;

          return (
            <div
              key={acc.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(acc)}
              onKeyDown={handleKeyDown(acc)}
              className="group relative flex items-center gap-3 rounded-lg
                         border border-slate-300/50 dark:border-slate-700/60
                         bg-white/70 dark:bg-slate-800/70
                         px-3 py-2 cursor-pointer select-none
                         hover:bg-indigo-50/70 dark:hover:bg-slate-800
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {/* avatar */}
              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {acc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={acc.avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* texts */}
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {name}
                </div>
                {showEmail && (
                  <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                )}
              </div>

              {/* remove button */}
              <button
                type="button"
                aria-label="ลบบัญชีนี้ออกจากรายการ"
                onClick={(e) => handleRemove(acc.id, e)}
                className="absolute -right-1 -top-1 hidden group-hover:flex
                           rounded-full bg-slate-200 hover:bg-slate-300
                           dark:bg-slate-700 dark:hover:bg-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
