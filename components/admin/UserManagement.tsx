// components/admin/UserManagement.tsx
"use client";

import { useEffect, useMemo, useState, ReactNode, ChangeEvent } from "react";
import type { ManagedUser, Subject, Class } from "@/lib/types";
import { useModal } from "@/contexts/ModalContext";
import { Settings, X, ShieldAlert } from "lucide-react";

/* ============================== Types =============================== */
type RoleUnion = "teacher" | "student";
type BanDuration = "24h" | "none";
const UNASSIGNED = "UNASSIGNED" as const;
const ALL = "ALL" as const;
type ClassKey = string | typeof UNASSIGNED;
type StudentClassTab = typeof ALL | ClassKey;

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

type ActionVariant = "success" | "error";
interface ActionResult {
  ok: boolean;
  message: string;
  variant?: ActionVariant;
}

type UpdateUserFn = (
  userId: string,
  updates: UpdateUserPayload
) => Promise<ActionResult>;
type BanUserFn = (userId: string, userEmail?: string) => Promise<ActionResult>;
type UnbanUserFn = (
  userId: string,
  userEmail?: string
) => Promise<ActionResult>;
type DeleteUserFn = (
  userId: string,
  userEmail: string
) => Promise<ActionResult>;

/* ---- type ของ useModal เพื่อเลี่ยง any ---- */
type ShowAlertOptions = {
  title: string;
  message: string;
  type?: "alert" | "info" | "success" | "error";
  /** ให้เด้งทับทุก modal */
  zIndex?: number;
};
type ShowConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};
interface ModalApi {
  showAlert: (opts: ShowAlertOptions) => Promise<void>;
  showConfirm: (opts: ShowConfirmOptions) => Promise<boolean>;
}

/* ---- ฟิลด์เสริมจาก DB ---- */
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

/* ============================== Reusable: Tabs =============================== */
function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium -mb-px border-b-2 transition-colors
        ${
          active
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        }`}
    >
      {children}
    </button>
  );
}

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
      {/* overlay ของ sheet (ต่ำกว่า alert) */}
      <div
        className={`fixed inset-0 z-[30] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        } bg-black/40`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 h-full z-[40] transform transition-transform duration-300 ease-out
    bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100
    border-l border-slate-200 dark:border-slate-700 shadow-xl
    ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width }}
        role="dialog"
        data-sheet="true"
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
        <div
          id="sheet-content"
          className="h-[calc(100%-56px)] overflow-auto p-4"
        >
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
  onDelete: DeleteUserFn;
  updating: string | null;
  open: boolean;
}) {
  const {
    user,
    subjects,
    classes,
    onClose,
    onSave,
    onBan,
    onUnban,
    onDelete,
    updating,
    open,
  } = props;

  const { showAlert, showConfirm } = useModal() as unknown as ModalApi;

  const [editing, setEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false); // overlay ขณะดำเนินการ
  const isBusy = updating === user.id || saving;

  // basic
  const [firstName, setFirstName] = useState<string>(user.first_name);
  const [lastName, setLastName] = useState<string>(user.last_name);
  const [role, setRole] = useState<RoleUnion>(
    (user.role as RoleUnion) ?? "student"
  );
  const [subjectId, setSubjectId] = useState<string>(user.subject_id ?? "");
  const [classId, setClassId] = useState<string>(user.class_id ?? "");

  // extra profile fields
  const [phone, setPhone] = useState<string>(user.phone ?? "");
  const [address, setAddress] = useState<string>(user.address ?? "");
  const [birthday, setBirthday] = useState<string>(user.birthday ?? "");
  const [department, setDepartment] = useState<string>(user.department ?? "");
  const [position, setPosition] = useState<string>(user.position ?? "");
  const [studentId, setStudentId] = useState<string>(user.student_id ?? "");
  const [bio] = useState<string>(user.bio ?? "");

  useEffect(() => {
    setEditing(false);
    setSaving(false);
  }, [user.id]);

  const handleChangeRole = (newRole: RoleUnion) => {
    setRole(newRole);
    if (newRole === "teacher") {
      setClassId("");
    } else if (newRole === "student") {
      setSubjectId("");
    }
  };

  const buildUpdates = (): UpdateUserPayload => {
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
    };
    if (role === "teacher") {
      updates.subject_id = subjectId || null;
      updates.class_id = null;
    } else {
      updates.class_id = classId || null;
      updates.subject_id = null;
    }
    return updates;
  };

  // รัน action พร้อม overlay แล้วค่อยเด้ง alert (ไม่ปิด sheet)
  const runWithOverlay = async (fn: () => Promise<ActionResult>) => {
    setSaving(true);
    const result = await fn().catch<ActionResult>(() => ({
      ok: false,
      message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      variant: "error",
    }));
    setSaving(false);

    await showAlert({
      title: result.ok ? "สำเร็จ" : "เกิดข้อผิดพลาด",
      message: result.message,
      type: result.ok ? "success" : "alert",
      zIndex: 10050, // เด้งทับ sheet
    });

    // ไม่ปิด sheet — ให้อยู่หน้าจัดการเดิม
  };

  const save = async () => {
    const updates = buildUpdates();
    await runWithOverlay(() => onSave(user.id, updates));
  };

  const isBanned =
    !!user.banned_until && new Date(user.banned_until) > new Date();

  const saveBtn =
    "px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400";
  const editBtn =
    "px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300";
  const warnBtn =
    "px-4 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300";
  const dangerBtn =
    "px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400";

  const readOnly = !editing || isBusy;

  return (
    <SideSheet open={open} onClose={onClose} title="จัดการผู้ใช้">
      {/* Saving overlay บน sheet */}
      {saving && (
        <div className="pointer-events-auto fixed inset-0 z-[905] flex items-center justify-center">
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px]" />
          <div className="relative z-[906] flex flex-col items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-5 shadow-lg">
            <div className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              กำลังบันทึกการเปลี่ยนแปลง…
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 space-y-1">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {user.email}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            {role === "teacher" ? "ครูผู้สอน" : "นักเรียน"}
          </span>
          {isBanned ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <ShieldAlert size={14} /> ถูกแบน
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              กำลังใช้งาน
            </span>
          )}
          <span className="ml-auto text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800">
            {editing ? "โหมดแก้ไข" : "ดูอย่างเดียว"}
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
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFirstName(e.target.value)
              }
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">นามสกุล</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLastName(e.target.value)
              }
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">เบอร์โทร</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPhone(e.target.value)
              }
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">วันเกิด</label>
            <input
              type="date"
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={birthday ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBirthday(e.target.value)
              }
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">ที่อยู่</label>
            <input
              className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={address}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAddress(e.target.value)
              }
              disabled={readOnly}
            />
          </div>
        </div>

        {/* บทบาท + การมอบหมาย */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">บทบาท</label>
            <select
              className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              value={role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChangeRole(e.target.value as RoleUnion)
              }
              disabled={readOnly}
            >
              <option value="teacher">ครูผู้สอน</option>
              <option value="student">นักเรียน</option>
            </select>
          </div>

          {role === "teacher" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">วิชาที่สอน</label>
              <select
                className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={subjectId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSubjectId(e.target.value)
                }
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

          {role === "student" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ห้อง / ชั้นเรียน</label>
              <select
                className="select-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={classId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setClassId(e.target.value)
                }
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
        {role === "teacher" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">แผนก/กลุ่มสาระ</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ตำแหน่ง</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}

        {role === "student" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">สายการเรียน / แผนก</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">รหัสนักเรียน</label>
              <input
                className="input-field w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}

        {/* ปุ่มการทำงาน */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={editBtn}
            disabled={saving}
          >
            {editing ? "หยุดแก้ไข" : "แก้ไข"}
          </button>

          <button
            onClick={() => void save()}
            disabled={!editing || isBusy}
            className={saveBtn}
          >
            บันทึก
          </button>

          {isBanned ? (
            <button
              onClick={() =>
                runWithOverlay(async () => {
                  const ok = await showConfirm({
                    title: "ยืนยันการยกเลิกแบน",
                    message: `ต้องการยกเลิกการแบนผู้ใช้ ${
                      user.email ?? ""
                    } หรือไม่?`,
                    confirmText: "ยกเลิกแบน",
                  });
                  if (!ok)
                    return {
                      ok: false,
                      message: "ยกเลิกการทำรายการ",
                      variant: "error",
                    };
                  return onUnban(user.id, user.email);
                })
              }
              disabled={isBusy}
              className={warnBtn}
            >
              ยกเลิกแบน
            </button>
          ) : (
            <button
              onClick={() =>
                runWithOverlay(async () => {
                  const ok = await showConfirm({
                    title: "ยืนยันการแบน",
                    message: `ต้องการแบนผู้ใช้ ${
                      user.email ?? ""
                    } เป็นเวลา 24 ชั่วโมงหรือไม่?`,
                    confirmText: "แบน",
                  });
                  if (!ok)
                    return {
                      ok: false,
                      message: "ยกเลิกการทำรายการ",
                      variant: "error",
                    };
                  return onBan(user.id, user.email);
                })
              }
              disabled={isBusy}
              className={warnBtn}
            >
              แบน (24 ชม.)
            </button>
          )}

          <button
            onClick={() =>
              runWithOverlay(async () => {
                const ok = await showConfirm({
                  title: "ยืนยันการลบ",
                  message: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${user.email} แบบถาวร?`,
                  confirmText: "ลบ",
                });
                if (!ok)
                  return {
                    ok: false,
                    message: "ยกเลิกการทำรายการ",
                    variant: "error",
                  };
                return onDelete(user.id, user.email);
              })
            }
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

/* ============================== ตารางผู้ใช้ (ครู/นักเรียน) =============================== */
function UserTable(props: {
  users: ManagedUser[];
  subjects: Subject[];
  classes: Class[];
  onOpenSettings: (user: ManagedUser) => void;
  updating: string | null;
  sectionRole: RoleUnion;
}) {
  const { users, subjects, classes, onOpenSettings, updating, sectionRole } =
    props;

  if (users.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 px-6 py-4">
        ไม่มีผู้ใช้ในหมวดนี้
      </p>
    );
  }

  const classNameMap: Record<string, string> = {};
  classes.forEach((c) => {
    classNameMap[c.id] = c.name;
  });

  const subjectNameMap: Record<string, string> = {};
  subjects.forEach((s) => {
    subjectNameMap[s.id] = s.name;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
        <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="py-3 px-6">ชื่อ - นามสกุล</th>
            <th className="py-3 px-6">อีเมล</th>
            <th className="py-3 px-6">
              {sectionRole === "teacher" ? "วิชาที่สอน" : "ห้องเรียน"}
            </th>
            <th className="py-3 px-6">สถานะ</th>
            <th className="py-3 px-6">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isBanned =
              !!user.banned_until && new Date(user.banned_until) > new Date();
            const busy = updating === user.id;

            const assignmentText =
              sectionRole === "teacher"
                ? user.subject_id
                  ? subjectNameMap[user.subject_id] ?? "ไม่ทราบ"
                  : "ยังไม่มอบหมาย"
                : user.class_id
                ? classNameMap[user.class_id] ?? "ไม่ทราบ"
                : "ยังไม่มอบหมาย";

            return (
              <tr
                key={user.id}
                className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {user.first_name} {user.last_name}
                </td>
                <td className="py-3 px-6">{user.email}</td>
                <td className="py-3 px-6">{assignmentText}</td>
                <td className="py-3 px-6">
                  {isBanned ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      ถูกแบน
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      กำลังใช้งาน
                    </span>
                  )}
                </td>
                <td className="py-3 px-6 whitespace-nowrap">
                  <button
                    onClick={() => onOpenSettings(user)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-md shadow-sm bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 disabled:opacity-60"
                    disabled={busy}
                    aria-label="เปิดหน้าต่างจัดการ"
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
  const [error, setError] = useState<string>("");

  const [updating, setUpdating] = useState<string | null>(null);
  const [settingsUser, setSettingsUser] = useState<ManagedUser | null>(null);

  const [activeTab, setActiveTab] = useState<"teacher" | "student">("teacher");
  const [activeClassTab, setActiveClassTab] = useState<StudentClassTab>(ALL);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const [usersRes, subjectsRes, classesRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/subjects"),
          fetch("/api/classes"),
        ]);

        if (!usersRes.ok) throw new Error("ไม่สามารถดึงผู้ใช้ได้");
        if (!subjectsRes.ok) throw new Error("ไม่สามารถดึงรายวิชาได้");
        if (!classesRes.ok) throw new Error("ไม่สามารถดึงชั้นเรียนได้");

        const usersData: ManagedUser[] = await usersRes.json();
        const subjectsData: Subject[] = await subjectsRes.json();
        const classesData: Class[] = await classesRes.json();

        // ตัด admin ออกจากรายการตั้งแต่ต้น
        setUsers(usersData.filter((u) => u.role !== "admin"));
        setSubjects(subjectsData);
        setClasses(classesData);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const { teachers, students } = useMemo(
    () => ({
      teachers: users.filter((u) => u.role === "teacher"),
      students: users.filter((u) => u.role === "student"),
    }),
    [users]
  );

  // จัดกลุ่มนักเรียนตามห้อง
  const { studentsByClass, classOrder, classNameMap } = useMemo(() => {
    const byClass: Record<ClassKey, ManagedUser[]> = {};
    const nameMap: Record<string, string> = {};

    classes
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((c) => {
        nameMap[c.id] = c.name;
      });

    students.forEach((s) => {
      const key: ClassKey = s.class_id ?? UNASSIGNED;
      if (!byClass[key]) byClass[key] = [];
      byClass[key].push(s);
    });

    const order: ClassKey[] = Object.keys(byClass)
      .filter((k) => k !== UNASSIGNED)
      .sort((a, b) =>
        (nameMap[a as string] || "").localeCompare(nameMap[b as string] || "")
      ) as ClassKey[];

    if (byClass[UNASSIGNED]?.length) order.push(UNASSIGNED);

    const map: Record<ClassKey, string> = {
      [UNASSIGNED]: "ยังไม่กำหนดห้อง",
      ...nameMap,
    };

    return { studentsByClass: byClass, classOrder: order, classNameMap: map };
  }, [students, classes]);

  // ตั้งค่าแท็บย่อยของนักเรียนครั้งแรก
  useEffect(() => {
    setActiveClassTab(ALL);
  }, [classOrder.length]);

  /* -------------------- actions -------------------- */
  const refreshUsers = async (): Promise<ManagedUser[]> => {
    const res = await fetch("/api/admin/users");
    const data: ManagedUser[] = await res.json();
    const filtered = data.filter((u) => u.role !== "admin");
    setUsers(filtered);
    return filtered;
  };

  const handleUpdateUser: UpdateUserFn = async (userId, updates) => {
    setUpdating(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });
      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        return {
          ok: false,
          message: errorData.error || "ไม่สามารถบันทึกได้",
          variant: "error",
        };
      }
      const list = await refreshUsers();
      // ถ้า sheet ยังเปิดอยู่ อัปเดตข้อมูลใน sheet ให้เป็นข้อมูลล่าสุด
      setSettingsUser((prev) =>
        prev ? list.find((u) => u.id === prev.id) ?? prev : prev
      );
      return {
        ok: true,
        message: "บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว",
        variant: "success",
      };
    } catch {
      return {
        ok: false,
        message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "error",
      };
    } finally {
      setUpdating(null);
    }
  };

  const handleBanUser: BanUserFn = async (userId, userEmail) => {
    setUpdating(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          updates: { ban_duration: "24h" as BanDuration },
        }),
      });
      if (!response.ok)
        return { ok: false, message: "แบนไม่สำเร็จ", variant: "error" };

      const list = await refreshUsers();
      setSettingsUser((prev) =>
        prev ? list.find((u) => u.id === prev.id) ?? prev : prev
      );
      return {
        ok: true,
        message: `${userEmail ?? "ผู้ใช้"} ถูกแบนแล้ว (24 ชั่วโมง)`,
        variant: "success",
      };
    } catch {
      return {
        ok: false,
        message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "error",
      };
    } finally {
      setUpdating(null);
    }
  };

  const handleUnbanUser: UnbanUserFn = async (userId, userEmail) => {
    setUpdating(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          updates: { ban_duration: "none" as BanDuration },
        }),
      });
      if (!response.ok)
        return { ok: false, message: "ยกเลิกแบนไม่สำเร็จ", variant: "error" };

      const list = await refreshUsers();
      setSettingsUser((prev) =>
        prev ? list.find((u) => u.id === prev.id) ?? prev : prev
      );
      return {
        ok: true,
        message: `${userEmail ?? "ผู้ใช้"} ถูกยกเลิกการแบนแล้ว`,
        variant: "success",
      };
    } catch {
      return {
        ok: false,
        message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "error",
      };
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser: DeleteUserFn = async (userId, userEmail) => {
    setUpdating(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok)
        return { ok: false, message: "ลบไม่สำเร็จ", variant: "error" };

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSettingsUser(null);
      return {
        ok: true,
        message: `ลบผู้ใช้ ${userEmail} เรียบร้อยแล้ว`,
        variant: "success",
      };
    } catch {
      return {
        ok: false,
        message: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "error",
      };
    } finally {
      setUpdating(null);
    }
  };

  /* -------------------- render -------------------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          กำลังโหลดข้อมูลผู้ใช้…
        </p>
      </div>
    );
  if (error)
    return <p className="text-center mt-4 text-red-500">ข้อผิดพลาด: {error}</p>;

  // เนื้อหาหน้ารายชื่อนักเรียนตามแท็บห้อง
  const renderStudentTabContent = () => {
    if (activeClassTab === ALL) {
      const all = classOrder.map((cid) => studentsByClass[cid]).flat();
      const unassigned = studentsByClass[UNASSIGNED] ?? [];
      const list = [...all, ...unassigned];
      return (
        <UserTable
          users={list}
          sectionRole="student"
          subjects={subjects}
          classes={classes}
          onOpenSettings={(u) => setSettingsUser(u)}
          updating={updating}
        />
      );
    }

    const list = studentsByClass[activeClassTab] ?? [];
    return (
      <UserTable
        users={list}
        sectionRole="student"
        subjects={subjects}
        classes={classes}
        onOpenSettings={(u) => setSettingsUser(u)}
        updating={updating}
      />
    );
  };

  return (
    <>
      {/* Global z-index fix: บังคับ alert modal ให้ทับทุกอย่างในหน้านี้ */}
      <style jsx global>{`
        /* ให้ dialog อื่น ๆ (เช่น alert) อยู่เหนือ sheet เสมอ */
        :where(body) > :where([role="dialog"]):not([data-sheet="true"]) {
          position: fixed !important;
          inset: 0 !important;
          z-index: 10050 !important;
          pointer-events: auto !important;
        }
      `}</style>

      <h1 className="text-3xl font-bold mb-6">จัดการผู้ใช้</h1>

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

      {/* แท็บหลัก */}
      <div className="border-b border-slate-300 dark:border-slate-700 mb-4 flex gap-4">
        <TabButton
          active={activeTab === "teacher"}
          onClick={() => setActiveTab("teacher")}
        >
          ครูผู้สอน
        </TabButton>
        <TabButton
          active={activeTab === "student"}
          onClick={() => setActiveTab("student")}
        >
          นักเรียน
        </TabButton>
      </div>

      {/* เนื้อหาแท็บหลัก */}
      {activeTab === "teacher" && (
        <UserTable
          users={teachers}
          sectionRole="teacher"
          subjects={subjects}
          classes={classes}
          onOpenSettings={(u) => setSettingsUser(u)}
          updating={updating}
        />
      )}

      {activeTab === "student" && (
        <div>
          {/* แท็บย่อย: ห้องเรียน */}
          <div className="border-b border-slate-200 dark:border-slate-700 mb-4 flex gap-2 overflow-x-auto">
            <TabButton
              active={activeClassTab === ALL}
              onClick={() => setActiveClassTab(ALL)}
            >
              ทั้งหมด
            </TabButton>
            {classOrder.map((cid) => (
              <TabButton
                key={cid}
                active={activeClassTab === cid}
                onClick={() => setActiveClassTab(cid)}
              >
                {classNameMap[cid]}
              </TabButton>
            ))}
            {studentsByClass[UNASSIGNED]?.length ? (
              <TabButton
                active={activeClassTab === UNASSIGNED}
                onClick={() => setActiveClassTab(UNASSIGNED)}
              >
                {classNameMap[UNASSIGNED]}
              </TabButton>
            ) : null}
          </div>

          {renderStudentTabContent()}
        </div>
      )}
    </>
  );
}
