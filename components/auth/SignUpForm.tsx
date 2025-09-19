"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AuthShell from "@/components/auth/AuthShell";

type Role = "student" | "teacher";

interface Class {
  id: string;
  name: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "เกิดข้อผิดพลาดที่ไม่คาดคิด";
  }
}

export default function SignUpForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // profile fields
  const [role, setRole] = useState<Role>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // ห้องเรียน
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState("");

  // ui
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // โหลดห้องเรียนมาแสดง dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/SignUpClasses");
        if (!res.ok) throw new Error("โหลดห้องเรียนไม่สำเร็จ");
        const data: Class[] = await res.json();
        setClasses(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const fieldClass =
    "w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 " +
    "shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";
  const labelClass =
    "block text-sm font-medium mb-2 text-slate-800 dark:text-slate-200";

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            bio: bio || null,
            birthday: birthday || null,
            phone: phone || null,
            address: address || null,
            student_id: role === "student" ? studentId : null,
            class_id: role === "student" ? classId : null,
            department: department || null,
            position: role === "teacher" ? position : null,
          },
          emailRedirectTo: `${location.origin}/auth/callback?role=${role}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setError("อีเมลนี้มีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบ");
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        const res = await fetch("/api/profiles/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            first_name: firstName,
            last_name: lastName,
            role,
            bio,
            birthday: birthday || null,
            phone,
            address,
            student_id: role === "student" ? studentId : null,
            class_id: role === "student" ? classId : null,
            department,
            position: role === "teacher" ? position : null,
          }),
        });
        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          console.warn("profiles upsert failed:", t?.error || res.statusText);
        }
      }

      setMessage("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ");
      router.push(`/${role}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีเพื่อเริ่มใช้งาน school-sys"
      rightSlot={
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="ปิดและกลับหน้าหลัก"
          title="ปิด"
          className="h-9 w-9 rounded-full flex items-center justify-center
                 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      }
    >
      {error && (
        <p
          className="text-red-600 dark:text-red-400 text-sm text-center mb-4"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="text-green-700 dark:text-green-400 text-sm text-center mb-4">
          {message}
        </p>
      )}

      <form onSubmit={handleSignUp} className="space-y-6">
        {/* บทบาท */}
        <div>
          <label htmlFor="role" className={labelClass}>
            สมัครในบทบาท
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={fieldClass}
            aria-label="เลือกบทบาทในการสมัคร"
          >
            <option value="student">นักเรียน</option>
            <option value="teacher">ครู/อาจารย์</option>
          </select>
        </div>

        {/* บัญชีผู้ใช้ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="อีเมลของคุณ"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${fieldClass} pr-10`}
                placeholder="••••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* โปรไฟล์พื้นฐาน */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              ชื่อ
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              นามสกุล
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {/* ฟิลด์เพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="birthday" className={labelClass}>
              วันเกิด
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              เบอร์โทรศัพท์
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              placeholder="เช่น 089xxxxxxx"
            />
          </div>
          <div>
            <label htmlFor="department" className={labelClass}>
              แผนก/สาขา
            </label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            ที่อยู่
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* เงื่อนไขตามบทบาท */}
        {role === "student" && (
          <>
            <div>
              <label htmlFor="studentId" className={labelClass}>
                รหัสนักเรียน/นิสิต
              </label>
              <input
                id="studentId"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="classId" className={labelClass}>
                เลือกห้องเรียน
              </label>
              <select
                id="classId"
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={fieldClass}
              >
                <option value="">— เลือกห้องเรียน —</option>
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
          </>
        )}

        {role === "teacher" && (
          <div>
            <label htmlFor="position" className={labelClass}>
              ตำแหน่ง
            </label>
            <input
              id="position"
              type="text"
              placeholder="เช่น อาจารย์ผู้สอน"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}

        {/* ข้อตกลง */}
        <label className="inline-flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            required
            type="checkbox"
            className="mt-0.5 rounded border-slate-300 dark:border-slate-600"
          />
          ฉันยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของ school-sys
        </label>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full rounded-md bg-indigo-600 text-white font-semibold py-2.5 shadow-sm
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60
                     dark:bg-indigo-500 dark:hover:bg-indigo-400 mt-2"
        >
          {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-600 dark:text-slate-300 mt-4">
        มีบัญชีอยู่แล้ว?{" "}
        <a href="/signin" className="text-indigo-600 hover:underline">
          เข้าสู่ระบบ
        </a>
      </div>
    </AuthShell>
  );
}
