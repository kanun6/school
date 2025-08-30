// components/teacher/GradeManagement.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { calculateGrade } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";

/* ===================== Types ===================== */
interface ClassData {
  id: string;
  name: string;
}

interface ComponentItem {
  id: string;      // component id (server id หรือ temp-uuid)
  name: string;
  max: number;     // คะแนนเต็มของช่องนี้
  position: number;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  componentScores: Record<string, number | null>; // key = componentId
  total: number;
  grade: string | null;
}

interface SchemeResponse {
  id: string;
  components: ComponentItem[];
}

interface GetClassListResponse {
  classes: ClassData[];
  subjectName: string;
}

interface GetClassDataResponse {
  scheme: SchemeResponse | null;
  students: StudentRow[];
  subjectName: string;
}

/* ===================== Component ===================== */
export default function GradeManagement() {
  const { showAlert, showConfirm } = useModal();

  // ทำให้ showAlert มี reference คงที่ ใช้ใน useEffect([]) ช่วงดึง classes ครั้งแรก
  const showAlertRef = useRef(showAlert);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [subjectName, setSubjectName] = useState<string>("");

  const [schemeId, setSchemeId] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);

  const [students, setStudents] = useState<StudentRow[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /* -------- Fetch classes once -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/grades?getClasses=true", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data: GetClassListResponse = await res.json();

        setClasses(data.classes ?? []);
        setSubjectName(data.subjectName ?? "");
        if ((data.classes ?? []).length > 0) {
          setSelectedClass(data.classes[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        await showAlertRef.current({ title: "เกิดข้อผิดพลาด", message: msg, type: "alert" });
        setLoading(false);
      }
    })();
  }, []); // ขนาด deps คงที่เสมอ

  /* -------- Fetch students + scheme when class changes -------- */
  const fetchStudentsAndScheme = useCallback(
    async (classId: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/teacher/grades?classId=${classId}`, { credentials: "include" });
        if (!res.ok) {
          const e = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(e?.error || "Failed to fetch");
        }
        const data: GetClassDataResponse = await res.json();

        setSubjectName(data.subjectName ?? "");
        setSchemeId(data.scheme?.id ?? null);
        setComponents(data.scheme?.components ?? []);
        setStudents(data.students ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        await showAlert({ title: "เกิดข้อผิดพลาด", message: msg, type: "alert" });
        setStudents([]);
        setComponents([]);
        setSchemeId(null);
      } finally {
        setLoading(false);
      }
    },
    [showAlert]
  );

  useEffect(() => {
    if (selectedClass) void fetchStudentsAndScheme(selectedClass);
  }, [selectedClass, fetchStudentsAndScheme]);

  /* -------- Component (scheme) editor -------- */
  const addComponent = () => {
    const tempId = `temp-${uuidv4()}`;
    setComponents((prev) => [
      ...prev,
      { id: tempId, name: "ช่องใหม่", max: 10, position: prev.length },
    ]);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        componentScores: { ...s.componentScores, [tempId]: null },
      }))
    );
  };

  // ลบ component + รีคำนวณ total/grade ของนักเรียนทุกคน
  const removeComponent = (compId: string) => {
    setComponents((prev) => {
      const nextComponents = prev
        .filter((c) => c.id !== compId)
        .map((c, idx) => ({ ...c, position: idx })); // จัด position ใหม่ให้ต่อเนื่อง

      setStudents((prevStudents) =>
        prevStudents.map((s) => {
          const cp = { ...s.componentScores };
          delete cp[compId];
          const total = nextComponents.reduce<number>(
            (sum, comp) => sum + (cp[comp.id] ?? 0),
            0
          );
          return { ...s, componentScores: cp, total, grade: calculateGrade(total) };
        })
      );

      return nextComponents;
    });
  };

  // 👉 ยืนยันก่อนลบช่องคะแนน
  const confirmRemoveComponent = async (comp: ComponentItem) => {
    const confirmed = await showConfirm({
      title: "ยืนยันการลบช่องคะแนน",
      message: `ต้องการลบช่อง "${comp.name}" (เต็ม ${comp.max} คะแนน) หรือไม่?\nคะแนนของนักเรียนในช่องนี้จะถูกลบไปด้วย`,
      confirmText: "ลบ",
    });
    if (!confirmed) return;

    removeComponent(comp.id);
    await showAlert({ title: "ลบแล้ว", message: `ลบช่อง "${comp.name}" เรียบร้อย` });
  };

  const updateComponentName = (compId: string, name: string) => {
    setComponents((prev) => prev.map((c) => (c.id === compId ? { ...c, name } : c)));
  };

  const updateComponentMax = (compId: string, maxStr: string) => {
    const n = maxStr === "" ? NaN : parseInt(maxStr, 10);
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? { ...c, max: isNaN(n) || n <= 0 ? c.max : Math.floor(n) }
          : c
      )
    );
  };

  /* -------- Score editing -------- */
  const handleScoreChange = (studentId: string, compId: string, value: string, max: number) => {
    const parsed = value === "" ? null : parseInt(value, 10);
    if (parsed !== null) {
      if (Number.isNaN(parsed) || parsed < 0) return;
      if (parsed > max) return;
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const next: Record<string, number | null> = { ...(s.componentScores || {}) };
        next[compId] = parsed;
        const total = components.reduce<number>((sum, comp) => sum + (next[comp.id] ?? 0), 0);
        return { ...s, componentScores: next, total, grade: calculateGrade(total) };
      })
    );
  };

  const anyOver100 = useMemo<boolean>(
    () => students.some((s) => (s.total ?? 0) > 100),
    [students]
  );

  /* -------- Save -------- */
  const handleSave = async () => {
    if (!selectedClass) return;

    if (anyOver100) {
      await showAlert({
        title: "คะแนนรวมเกิน 100",
        message: "โปรดปรับคะแนนให้รวมต่อคนไม่เกิน 100 ก่อนบันทึก",
        type: "alert",
      });
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const schemePayload: {
        id?: string;
        components: { id?: string; name: string; max: number; position: number }[];
      } = {
        id: schemeId ?? undefined,
        components: components.map((c, idx) => ({
          id: c.id.startsWith("temp-") ? undefined : c.id,
          name: c.name.trim() || "ช่อง",
          max: c.max,
          position: idx,
        })),
      };

      const gradesPayload: {
        studentId: string;
        components: { itemId: string; score: number | null }[];
      }[] = students.map((s) => ({
        studentId: s.id,
        components: components.map((c) => ({
          // temp id จะถูกละทิ้งตอนสร้าง component ใหม่ฝั่ง server จากนั้น reload จะได้ id จริงกลับมา
          itemId: c.id,
          score: s.componentScores[c.id] ?? null,
        })),
      }));

      const res = await fetch("/api/teacher/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          classId: selectedClass,
          scheme: schemePayload,
          grades: gradesPayload,
        }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Failed to save");
      }

      await showAlert({ title: "สำเร็จ", message: "บันทึกคะแนนเรียบร้อยแล้ว" });
      // reload เพื่อดึง component id จริงแทน temp-*
      await fetchStudentsAndScheme(selectedClass);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      await showAlert({ title: "เกิดข้อผิดพลาด", message: msg, type: "alert" });
    } finally {
      setIsSaving(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">บันทึกผลการเรียน</h1>
        </div>
        <div className="text-right">
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            วิชา: <span className="font-semibold">{subjectName || "Loading..."}</span>
          </p>
          {classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="select-field max-w-xs mt-2"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && !loading && (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      )}

      {/* Scheme Builder */}
      <div className="mb-4 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">กำหนดส่วนคะแนน</h2>
          <button
            onClick={addComponent}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
          >
            เพิ่มช่องคะแนน
          </button>
        </div>

        {components.length === 0 ? (
          <p className="text-gray-500 mt-3">ยังไม่มีช่องคะแนน — กด “เพิ่มช่องคะแนน”</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">ชื่อช่อง</th>
                  <th className="px-4 py-2 text-left">คะแนนเต็ม</th>
                  <th className="px-4 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id} className="border-b border-gray-200 dark:border-gray-600">
                    <td className="px-4 py-2">
                      <input
                        className="input-field w-full"
                        value={c.name}
                        onChange={(e) => updateComponentName(c.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input-field w-28"
                        type="number"
                        min={1}
                        value={c.max}
                        onChange={(e) => updateComponentMax(c.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => void confirmRemoveComponent(c)}
                        className="text-red-600 hover:underline"
                      >
                        ลบช่องนี้
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scores Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ชื่อ - สกุล
              </th>
              {components.map((c) => (
                <th
                  key={c.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                >
                  {c.name} (เต็ม {c.max})
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                รวม (≤100)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เกรด
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {loading ? (
              <tr>
                <td colSpan={2 + components.length} className="text-center py-4">
                  Loading students...
                </td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s) => {
                const over = (s.total ?? 0) > 100;
                return (
                  <tr key={s.id} className={over ? "bg-red-50 dark:bg-red-900/20" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.first_name} {s.last_name}
                    </td>
                    {components.map((c) => (
                      <td key={c.id} className="px-6 py-4">
                        <input
                          type="number"
                          className="input-field w-28"
                          min={0}
                          max={c.max}
                          value={s.componentScores?.[c.id] ?? ""}
                          onChange={(e) => handleScoreChange(s.id, c.id, e.target.value, c.max)}
                          placeholder={`0-${c.max}`}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 font-semibold">
                      <span className={over ? "text-red-600" : ""}>{s.total ?? 0}</span>
                      {over && <span className="ml-2 text-xs text-red-500">(เกิน 100)</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-lg">{s.grade ?? "-"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={2 + components.length} className="text-center py-4 text-gray-500">
                  ไม่พบนักเรียนในห้องนี้ หรือยังไม่มีการสอนในห้องนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Save */}
      {students.length > 0 && (
        <div className="mt-6 flex justify-end items-center gap-4">
          {anyOver100 && (
            <p className="text-red-600 text-sm">
              มีผู้เรียนที่คะแนนรวมเกิน 100 — โปรดแก้ไขก่อนบันทึก
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || anyOver100}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
          </button>
        </div>
      )}
    </div>
  );
}
