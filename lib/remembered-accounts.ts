export interface RememberedAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  lastUsedAt: number;
}

const KEY = 'school-sys/remembered-accounts';

export function loadAccounts(): RememberedAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: RememberedAccount[] = raw ? JSON.parse(raw) : [];
    // เรียงล่าสุดอยู่ก่อน
    return list.sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, 8);
  } catch {
    return [];
  }
}

export function saveAccount(acc: Omit<RememberedAccount, 'lastUsedAt'>) {
  if (typeof window === 'undefined') return;
  const list = loadAccounts();
  const exists = list.findIndex((x) => x.id === acc.id);
  const entry: RememberedAccount = { ...acc, lastUsedAt: Date.now() };
  if (exists >= 0) list[exists] = entry; else list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)));
}

export function removeAccount(id: string) {
  if (typeof window === 'undefined') return;
  const next = loadAccounts().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearAllAccounts() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
