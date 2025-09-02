'use client';

import { useEffect, useMemo, useState, ReactNode, ChangeEvent } from 'react';
import type { ManagedUser, Subject, Class } from '@/lib/types';
import { useModal } from '@/contexts/ModalContext';
import { Settings, X, ShieldAlert } from 'lucide-react';

type RoleUnion = 'admin' | 'teacher' | 'student';
type BanDuration = '24h' | 'none';

type UpdateUserPayload = Partial<{
  // profiles
  first_name: string;
  last_name: string;
  role: RoleUnion;
  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  position: string | null;
  student_id: string | null;
  // assignments
  subject_id: string | null;
  class_id: string | null;
  // auth
  ban_duration: BanDuration;
}>;

type UpdateUserFn = (userId: string, updates: UpdateUserPayload) => Promise<void>;
type BanUserFn = (userId: string, userEmail?: string) => Promise<void>;
type UnbanUserFn = (userId: string, userEmail?: string) => Promise<void>;

const UNASSIGNED = 'UNASSIGNED' as const;
type ClassKey = string | typeof UNASSIGNED;

// ---- ขยาย ManagedUser เพื่ออ่านฟิลด์เสริมจาก DB (optional) ----
type ManagedUserEx = ManagedUser & {
  profile_image_url?: string | null;
  bio?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  student_id?: string | null;
  department?: string | null;
  position?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

/* ============================== Side Sheet =============================== */
function SideSheet(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const { open, title, onClose, children, width = 560 } = props;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } bg-black/40`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 h-full z-[61] transform transition-transform duration-300 ease-out
          bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100
          border-l border-slate-200 dark:border-slate-700 shadow-xl
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width }}
        role="dialog"
        aria-labelledby="sheet-title"
        aria-describedby="sheet-content"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 id="sheet-title" className="text-base font-semibold">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div id="sheet-content" className="h-[calc(100%-56px)] overflow-auto p-4">
          {children}
        </div>
      </aside>
    </>
  );
}

/* ============================== Manage Sheet =============================== */
function SettingsSheet(props: {
  user: ManagedUserEx;
  subjects: Subject[];
  classes: Class[];
  onClose: () => void;
  onSave: UpdateUserFn;
  onBan: BanUserFn;
  onUnban: UnbanUserFn;
  onDelete: (userId: string, userEmail: string) => Promise<void>;
  updating: string | null;
  open: boolean;
}) {
  const { user, subjects, classes, onClose, onSave, onBan, onUnban, onDelete, updating, open } =
    props;

  const [editing, setEditing] = useState<boolean>(false);
  const isBusy = updating === user.id;

  // basic
  const [firstName, setFirstName] = useState<string>(user.first_name);
  const [lastName, setLastName] = useState<string>(user.last_name);
  const [role, setRole] = useState<RoleUnion>(user.role as RoleUnion);
  const [subjectId, setSubjectId] = useState<string>(user.subject_id ?? '');
  const [classId, setClassId] = useState<string>(user.class_id ?? '');

  // extra profile fields
  const [phone, setPhone] = useState<string>(user.phone ?? '');
  const [address, setAddress] = useState<string>(user.address ?? '');
  const [birthday, setBirthday] = useState<string>(user.birthday ?? '');
  const [department, setDepartment] = useState<string>(user.department ?? '');
  const [position, setPosition] = useState<string>(user.position ?? '');
  const [studentId, setStudentId] = useState<string>(user.student_id ?? '');
  const [bio, setBio] = useState<string>(user.bio ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user.profile_image_url ?? null);

  // เมื่อเปลี่ยนผู้ใช้ ให้กลับไปโหมดดูอย่างเดียว
  useEffect(() => {
    setEditing(false);
  }, [user.id]);

  const handleChangeRole = (newRole: RoleUnion) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setSubjectId('');
      setClassId('');
    } else if (newRole === 'teacher') {
      setClassId('');
    } else if (newRole === 'student') {
      setSubjectId('');
    }
  };

  const save = async () => {
    const updates: UpdateUserPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      phone: phone || null,
      address: address || null,
      birthday: birthday || null,
      department: department || null,
      position: position || null,
      student_id: studentId || null,
      bio: bio || null,
      profile_image_url: profileImageUrl ?? null,
    };

    if (role === 'teacher') {
      updates.subject_id = subjectId || null;
      updates.class_id = null;
    } else if (role === 'student') {
      updates.class_id = classId || null;
      updates.subject_id = null;
    } else {
      updates.subject_id = null;
      updates.class_id = null;
    }

    onClose(); // ปิด sheet ทันที
    await onSave(user.id, updates);
  };

  const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();

  // ปุ่มสี
  const saveBtn =
    'px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400';
  const editBtn =
    'px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300';
  const warnBtn =
    'px-4 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300';
  const dangerBtn =
    'px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400';

  const readOnly = !editing || isBusy;

  return (
    <SideSheet open={open} onClose={onClose} title="จัดการผู้ใช้">
      {/* Header */}
      <div className="mb-4 space-y-1">
        <div className="text-sm text-slate-600 dark:text-slate-300">{user.email}</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 capitalize">
            {user.role}
          </span>
          {isBanned ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <ShieldAlert size={14} /> ถูกแบน
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              กำลังใช้งาน
            </span>
          )}
          <span className="ml-auto text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800">
            {editing ? 'โหมดแก้ไข' : 'ดูอย่างเดียว'}
          </span>
        </div>
      </div>

      {/* ฟอร์ม */}
      <div className="space-y-4">
        {/* ข้อมูลพื้นฐาน */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ชื่อ</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">นามสกุล</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">เบอร์โทร</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">วันเกิด</label>
            <input
              type="date"
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={birthday ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthday(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">ที่อยู่</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={address}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* บทบาท + การมอบหมาย */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">บทบาท</label>
            <select
              className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                         text-slate-900 dark:text-slate-100"
              value={role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChangeRole(e.target.value as RoleUnion)
              }
              disabled={readOnly}
            >
              <option value="admin">admin</option>
              <option value="teacher">teacher</option>
              <option value="student">student</option>
            </select>
          </div>

          {role === 'teacher' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">วิชา (Subject)</label>
              <select
                className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={subjectId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSubjectId(e.target.value)}
                disabled={readOnly}
              >
                <option value="">— ยังไม่มอบหมาย —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === 'student' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ห้อง / ชั้นเรียน</label>
              <select
                className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={classId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setClassId(e.target.value)}
                disabled={readOnly}
              >
                <option value="">— ยังไม่มอบหมาย —</option>
                {classes
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* ข้อมูลเฉพาะบทบาท */}
        {role === 'teacher' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">แผนก/กลุ่มสาระ</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ตำแหน่ง</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}

        {role === 'student' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">สายการเรียน / แผนก</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">รหัสนักเรียน</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700
                           text-slate-900 dark:text-slate-100"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}

        {/* ปุ่มการทำงาน */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {/* เปิด/ปิดโหมดแก้ไข = น้ำเงิน */}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={editBtn}
          >
            {editing ? 'หยุดแก้ไข' : 'แก้ไข'}
          </button>

          {/* บันทึก = เขียว (ต้องอยู่ในโหมดแก้ไข) */}
          <button onClick={save} disabled={!editing || isBusy} className={saveBtn}>
            บันทึก
          </button>

          {/* แบน/ยกเลิกแบน = ส้ม */}
          {isBanned ? (
            <button
              onClick={() => {
                onClose(); // ปิดทันที
                void onUnban(user.id, user.email);
              }}
              disabled={isBusy}
              className={warnBtn}
            >
              ยกเลิกแบน
            </button>
          ) : (
            <button
              onClick={() => {
                onClose(); // ปิดทันที
                void onBan(user.id, user.email);
              }}
              disabled={isBusy}
              className={warnBtn}
            >
              แบน (24 ชม.)
            </button>
          )}

          {/* ลบ = แดง */}
          <button
            onClick={() => {
              onClose(); // ปิดทันที
              void onDelete(user.id, user.email);
            }}
            disabled={isBusy}
            className={dangerBtn}
          >
            ลบ
          </button>
        </div>
      </div>
    </SideSheet>
  );
}

/* ============================== ตารางผู้ใช้ =============================== */
function UserTable(props: {
  users: ManagedUser[];
  subjects: Subject[];
  classes: Class[];
  onOpenSettings: (user: ManagedUser) => void;
  updating: string | null;
  sectionRole: RoleUnion;
}) {
  const { users, subjects, classes, onOpenSettings, updating, sectionRole } = props;

  if (users.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 px-6 py-4">
        ไม่มีผู้ใช้ในหมวดนี้
      </p>
    );
  }

  const classNameMap: Record<string, string> = {};
  classes.forEach((c) => { classNameMap[c.id] = c.name; });

  const subjectNameMap: Record<string, string> = {};
  subjects.forEach((s) => { subjectNameMap[s.id] = s.name; });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
        <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="py-3 px-6">ชื่อ - นามสกุล</th>
            <th className="py-3 px-6">อีเมล</th>
            {sectionRole !== 'admin' && <th className="py-3 px-6">การมอบหมาย</th>}
            <th className="py-3 px-6">บทบาท</th>
            <th className="py-3 px-6">สถานะ</th>
            <th className="py-3 px-6">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();
            const busy = updating === user.id;

            const assignmentText =
              sectionRole === 'teacher'
                ? user.subject_id
                  ? subjectNameMap[user.subject_id] ?? 'ไม่ทราบ'
                  : 'ยังไม่มอบหมาย'
                : sectionRole === 'student'
                ? user.class_id
                  ? classNameMap[user.class_id] ?? 'ไม่ทราบ'
                  : 'ยังไม่มอบหมาย'
                : '-';

            return (
              <tr
                key={user.id}
                className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {user.first_name} {user.last_name}
                </td>
                <td className="py-3 px-6">{user.email}</td>

                {sectionRole !== 'admin' && (
                  <td className="py-3 px-6">{assignmentText}</td>
                )}

                <td className="py-3 px-6 capitalize">{user.role}</td>

                <td className="py-3 px-6">
                  {isBanned ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      ถูกแบน
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      กำลังใช้งาน
                    </span>
                  )}
                </td>

                <td className="py-3 px-6 whitespace-nowrap">
                  <button
                    onClick={() => onOpenSettings(user)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-md shadow-sm
                               bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2
                               focus:ring-slate-500 dark:focus:ring-offset-slate-900 disabled:opacity-60"
                    disabled={busy}
                    aria-label="Open manage"
                    title="จัดการ"
                  >
                    <Settings size={16} />
                    จัดการ
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================== หน้าเพจหลัก =============================== */
export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [settingsUser, setSettingsUser] = useState<ManagedUser | null>(null);

  const { showConfirm, showAlert } = useModal();

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [usersRes, subjectsRes, classesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/subjects'),
        fetch('/api/classes'),
      ]);

      if (!usersRes.ok) throw new Error('ไม่สามารถดึงผู้ใช้ได้');
      if (!subjectsRes.ok) throw new Error('ไม่สามารถดึงรายวิชาได้');
      if (!classesRes.ok) throw new Error('ไม่สามารถดึงชั้นเรียนได้');

      const usersData: ManagedUser[] = await usersRes.json();
      const subjectsData: Subject[] = await subjectsRes.json();
      const classesData: Class[] = await classesRes.json();

      setUsers(usersData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const { admins, teachers, students } = useMemo(() => ({
    admins: users.filter((u) => u.role === 'admin'),
    teachers: users.filter((u) => u.role === 'teacher'),
    students: users.filter((u) => u.role === 'student'),
  }), [users]);

  // จัดกลุ่มนักเรียนตามห้อง
  const { studentsByClass, classOrder, classNameMap } = useMemo(() => {
    const byClass: Record<ClassKey, ManagedUser[]> = {};
    const nameMap: Record<string, string> = {};

    classes.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((c) => {
      nameMap[c.id] = c.name;
    });

    students.forEach((s) => {
      const key: ClassKey = s.class_id ?? UNASSIGNED;
      if (!byClass[key]) byClass[key] = [];
      byClass[key].push(s);
    });

    const order: ClassKey[] = Object.keys(byClass)
      .filter((k) => k !== UNASSIGNED)
      .sort((a, b) => (nameMap[a as string] || '').localeCompare(nameMap[b as string] || '')) as ClassKey[];

    if (byClass[UNASSIGNED]?.length) order.push(UNASSIGNED);

    const map: Record<ClassKey, string> = { [UNASSIGNED]: 'ยังไม่มอบหมาย', ...nameMap };

    return { studentsByClass: byClass, classOrder: order, classNameMap: map };
  }, [students, classes]);

  const [openSections, setOpenSections] = useState<Record<ClassKey, boolean>>({});
  useEffect(() => {
    const initial: Record<ClassKey, boolean> = {};
    classOrder.forEach((id) => { initial[id] = true; });
    setOpenSections(initial);
  }, [classOrder]);

  const toggleOpen = (id: ClassKey) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const [openAdmins, setOpenAdmins] = useState<boolean>(true);
  const [openTeachers, setOpenTeachers] = useState<boolean>(true);

  const handleUpdateUser: UpdateUserFn = async (userId, updates) => {
    setUpdating(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถบันทึกได้');
      }
      await fetchData();
      await showAlert({ title: 'สำเร็จ', message: 'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: msg, type: 'alert' });
    } finally {
      setUpdating(null);
    }
  };

  const handleBanUser: BanUserFn = async (userId, userEmail) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการแบน',
      message: `ต้องการแบนผู้ใช้ ${userEmail ?? ''} เป็นเวลา 24 ชั่วโมงหรือไม่?`,
      confirmText: 'แบน',
    });
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { ban_duration: '24h' as BanDuration } }),
      });
      if (!response.ok) throw new Error('แบนไม่สำเร็จ');
      await fetchData();
      await showAlert({ title: 'สำเร็จ', message: `${userEmail ?? 'ผู้ใช้'} ถูกแบนแล้ว (24 ชั่วโมง)` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: msg, type: 'alert' });
    } finally {
      setUpdating(null);
    }
  };

  const handleUnbanUser: UnbanUserFn = async (userId, userEmail) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการยกเลิกแบน',
      message: `ต้องการยกเลิกการแบนผู้ใช้ ${userEmail ?? ''} หรือไม่?`,
      confirmText: 'ยกเลิกแบน',
    });
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { ban_duration: 'none' as BanDuration } }),
      });
      if (!response.ok) throw new Error('ยกเลิกแบนไม่สำเร็จ');
      await fetchData();
      await showAlert({ title: 'สำเร็จ', message: `${userEmail ?? 'ผู้ใช้'} ถูกยกเลิกการแบนแล้ว` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: msg, type: 'alert' });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการลบ',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${userEmail} แบบถาวร?`,
      confirmText: 'ลบ',
    });
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('ลบไม่สำเร็จ');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      await showAlert({ title: 'สำเร็จ', message: `ลบผู้ใช้ ${userEmail} เรียบร้อยแล้ว` });
      setSettingsUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="text-center mt-4">กำลังโหลดข้อมูลผู้ใช้…</p>;
  if (error) return <p className="text-center mt-4 text-red-500">ข้อผิดพลาด: {error}</p>;

  return (
    <>
      {settingsUser && (
        <SettingsSheet
          open={!!settingsUser}
          user={settingsUser as ManagedUserEx}
          subjects={subjects}
          classes={classes}
          onClose={() => setSettingsUser(null)}
          onSave={handleUpdateUser}
          onBan={handleBanUser}
          onUnban={handleUnbanUser}
          onDelete={handleDeleteUser}
          updating={updating}
        />
      )}

      <div className="space-y-8">
        <h3 className="text-xl font-semibold mb-2">ผู้ดูแลระบบ</h3>
        <div className="mb-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenAdmins((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 text-left"
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Admin ({admins.length})
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {openAdmins ? 'ซ่อน' : 'แสดง'}
            </span>
          </button>
          {openAdmins && (
            <div className="bg-white dark:bg-slate-900 rounded-b-lg shadow-md overflow-hidden">
              <UserTable
                users={admins}
                sectionRole="admin"
                subjects={subjects}
                classes={classes}
                onOpenSettings={(u) => setSettingsUser(u)}
                updating={updating}
              />
            </div>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">ครูผู้สอน</h3>
        <div className="mb-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenTeachers((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 text-left"
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Teachers ({teachers.length})
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {openTeachers ? 'ซ่อน' : 'แสดง'}
            </span>
          </button>
          {openTeachers && (
            <div className="bg-white dark:bg-slate-900 rounded-b-lg shadow-md overflow-hidden">
              <UserTable
                users={teachers}
                sectionRole="teacher"
                subjects={subjects}
                classes={classes}
                onOpenSettings={(u) => setSettingsUser(u)}
                updating={updating}
              />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">นักเรียน</h3>
          {classOrder.map((classId) => {
            const list = studentsByClass[classId] || [];
            if (list.length === 0) return null;

            const title =
              classId === UNASSIGNED
                ? `${classNameMap[UNASSIGNED]} (${list.length})`
                : `${classNameMap[classId] ?? 'ไม่ทราบ'} (${list.length})`;

            const open = openSections[classId] ?? true;

            return (
              <div
                key={classId}
                className="mb-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleOpen(classId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {open ? 'ซ่อน' : 'แสดง'}
                  </span>
                </button>

                {open && (
                  <div className="bg-white dark:bg-slate-900 rounded-b-lg shadow-sm overflow-hidden">
                    <UserTable
                      users={list}
                      sectionRole="student"
                      subjects={subjects}
                      classes={classes}
                      onOpenSettings={(u) => setSettingsUser(u)}
                      updating={updating}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
