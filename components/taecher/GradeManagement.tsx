"use client";

import { useState, useEffect, useCallback, useMemo, useRef, JSX } from "react";
import { v4 as uuidv4 } from "uuid";
// สมมติว่าไฟล์เหล่านี้มีอยู่จริงในโปรเจกต์
import { calculateGrade } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";

/* ===================== Modal Context Utility Types (Assumed) ===================== */

// กำหนด Type สำหรับ utility functions ของ Modal Context เพื่อความชัดเจนของ Type
interface ModalControlProps {
  title: string;
  message: string;
  type?: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
}

type ShowAlert = (
  props: Omit<ModalControlProps, "type" | "confirmText" | "cancelText"> & {
    type: "alert";
  }
) => Promise<void>;

type ShowConfirm = (
  props: Omit<ModalControlProps, "type"> & { type: "confirm" }
) => Promise<boolean>;

/* ===================== Data Types ===================== */
interface ClassData {
  id: string;
  name: string;
}

interface ComponentItem {
  id: string; // component id (server id or temp-uuid)
  name: string;
  max: number; // คะแนนเต็ม
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

/* Payload types for saving */
interface SaveComponentPayload {
  id?: string;
  name: string;
  max: number;
  position: number;
}

interface SaveSchemePayload {
  id?: string;
  components: SaveComponentPayload[];
}

interface GradeComponentItem {
  itemId: string;
  score: number | null;
}

interface SaveGradeItem {
  studentId: string;
  components: GradeComponentItem[];
}

interface SaveResponse {
  error?: string; // สำหรับรับ error จาก server
}

/* ===================== Component ===================== */
export default function GradeManagement(): JSX.Element {
  // Typecasting hook returns based on the assumed types above
  const { showAlert, showConfirm } = useModal() as {
    showAlert: ShowAlert;
    showConfirm: ShowConfirm;
  };

  // Fixed type for showAlertRef
  const showAlertRef = useRef<ShowAlert>(showAlert);
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
  const [isSaving, setIsSaving] = useState<boolean>(false); // Used for saving animation
  const [error, setError] = useState<string>("");

  /* -------- ดึงรายชื่อห้องครั้งแรก -------- */
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/teacher/grades?getClasses=true", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("โหลดรายชื่อห้องเรียนไม่สำเร็จ");
        const data: GetClassListResponse = await res.json();

        setClasses(data.classes ?? []);
        setSubjectName(data.subjectName ?? "");
        if ((data.classes ?? []).length > 0) {
          setSelectedClass(data.classes[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: unknown) { // Use unknown for better error handling
        const msg =
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุขณะโหลดรายชื่อห้อง";
        setError(msg);
        await showAlertRef.current({
          title: "เกิดข้อผิดพลาด",
          message: msg,
          type: "alert",
        });
        setLoading(false);
      }
    };
    void fetchClasses();
  }, []); // Empty dependency array means this runs only once

  /* -------- ดึงนักเรียน + โครงสร้างคะแนนเมื่อเปลี่ยนห้อง -------- */
  const fetchStudentsAndScheme = useCallback(
    async (classId: string) => {
      // ไม่ต้องใส่ setLoading(true) ที่นี่ เพราะฟังก์ชันนี้ถูกเรียกจาก handleSave
      // และเราจะใส่ setLoading(false) ใน finally ของ handleSave เอง
      setError("");
      try {
        const res = await fetch(`/api/teacher/grades?classId=${classId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const e = (await res.json().catch(() => null)) as SaveResponse | null;
          throw new Error(e?.error || "โหลดข้อมูลไม่สำเร็จ");
        }
        const data: GetClassDataResponse = await res.json();

        setSubjectName(data.subjectName ?? "");
        // ต้องมั่นใจว่า componentScore มีค่าสำหรับทุกนักเรียน
        const studentRows: StudentRow[] = (data.students ?? []).map((s) => ({
          ...s,
          componentScores: s.componentScores || {},
        }));

        setSchemeId(data.scheme?.id ?? null);
        setComponents(data.scheme?.components ?? []);
        setStudents(studentRows);
        
      } catch (err: unknown) {
        // ในกรณีที่ fetchStudentsAndScheme ล้มเหลวหลังจาก Save สำเร็จ
        // เราจะไม่แสดง alert ซ้ำ เพราะ handleSave จะ handle error ไปแล้ว
        const msg =
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        console.error("Error reloading data after save:", msg);
        // ไม่ set error state ที่นี่เพื่อไม่ให้ UI แสดง error แต่จะ console.error แทน
      }
      
    },
    [] // dependency array empty because showAlert is passed via ref or it's implicitly available
  );

  // Initial load or class change
  useEffect(() => {
    if (selectedClass) {
        setLoading(true); // ตั้งค่า Loading เป็น true เมื่อเริ่มโหลดข้อมูล
        void fetchStudentsAndScheme(selectedClass).then(() => {
            setLoading(false); // ปิด Loading เมื่อโหลดเสร็จ
        });
    }
  }, [selectedClass, fetchStudentsAndScheme]);

  /* -------- ตัวแก้ไขโครงสร้างคะแนน (scheme) -------- */
  const addComponent = (): void => {
    const tempId = `temp-${uuidv4()}`;
    setComponents((prev: ComponentItem[]) => [
      ...prev,
      { id: tempId, name: "ช่องใหม่", max: 10, position: prev.length },
    ]);
    // เพิ่มช่องคะแนนใหม่ให้กับนักเรียนทุกคน
    setStudents((prev: StudentRow[]) =>
      prev.map((s) => ({
        ...s,
        componentScores: { ...s.componentScores, [tempId]: null },
      }))
    );
  };

  // ลบ component + รีคำนวณ total/grade ของนักเรียนทุกคน
  const removeComponent = (compId: string): void => {
    setComponents((prev) => {
      const nextComponents: ComponentItem[] = prev
        .filter((c) => c.id !== compId)
        .map((c, idx) => ({ ...c, position: idx })); // จัด position ใหม่

      setStudents((prevStudents: StudentRow[]) =>
        prevStudents.map((s) => {
          const cp: Record<string, number | null> = { ...s.componentScores };
          delete cp[compId];

          // คำนวณคะแนนรวมใหม่
          const total: number = nextComponents.reduce<number>(
            (sum, comp) => sum + (cp[comp.id] ?? 0),
            0
          );
          return {
            ...s,
            componentScores: cp,
            total,
            grade: calculateGrade(total),
          };
        })
      );

      return nextComponents;
    });
  };

  // ยืนยันก่อนลบช่องคะแนน
  const confirmRemoveComponent = async (comp: ComponentItem): Promise<void> => {
    const confirmed = await showConfirm({
      title: "ยืนยันการลบช่องคะแนน",
      message: `ต้องการลบช่อง "${comp.name}" (เต็ม ${comp.max} คะแนน) หรือไม่?\nคะแนนของนักเรียนในช่องนี้จะถูกลบไปด้วย`,
      confirmText: "ลบ",
      type: "confirm",
    });
    if (!confirmed) return;

    removeComponent(comp.id);
    await showAlert({
      title: "ลบแล้ว",
      message: `ลบช่อง "${comp.name}" เรียบร้อย`,
      type: "alert",
    });
  };

  const updateComponentName = (compId: string, name: string): void => {
    setComponents((prev) =>
      prev.map((c) => (c.id === compId ? { ...c, name } : c))
    );
  };

  const updateComponentMax = (compId: string, maxStr: string): void => {
    const n = maxStr === "" ? NaN : parseInt(maxStr, 10);
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? { ...c, max: isNaN(n) || n <= 0 ? c.max : Math.floor(n) }
          : c
      )
    );
  };

  /* -------- แก้ไขคะแนน -------- */
  const handleScoreChange = (
    studentId: string,
    compId: string,
    value: string,
    max: number
  ): void => {
    const parsed: number | null = value === "" ? null : parseInt(value, 10);
    if (parsed !== null) {
      if (Number.isNaN(parsed) || parsed < 0) return;
      if (parsed > max) return;
    }

    setStudents((prev: StudentRow[]) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        // Ensure components are up-to-date for total calculation
        const currentComponents = components;

        const nextScores: Record<string, number | null> = {
          ...(s.componentScores || {}),
        };
        nextScores[compId] = parsed;

        // คำนวณคะแนนรวมใหม่จาก scores ปัจจุบันและโครงสร้างคะแนนที่อัปเดต
        const total: number = currentComponents.reduce<number>(
          (sum, comp) => sum + (nextScores[comp.id] ?? 0),
          0
        );

        return {
          ...s,
          componentScores: nextScores,
          total,
          grade: calculateGrade(total),
        };
      })
    );
  };

  const anyOver100 = useMemo<boolean>(
    () => students.some((s) => (s.total ?? 0) > 100),
    [students]
  );

  /* ======= Validation before save (ใช้ showAlert ถ้ามีปัญหา) ======= */
  const validateBeforeSave = (): string[] => {
    const issues: string[] = [];

    // map components by id for quick lookup
    const compMap: Record<string, ComponentItem> = components.reduce(
      (acc, c) => {
        acc[c.id] = c;
        return acc;
      },
      {} as Record<string, ComponentItem>
    );

    for (const s of students) {
      // per-component check
      const studentComponentScores = s.componentScores || {};
      for (const compId in studentComponentScores) {
        if (!Object.prototype.hasOwnProperty.call(studentComponentScores, compId))
          continue;

        const score = studentComponentScores[compId];
        const comp = compMap[compId];

        if (!comp) continue; // ถ้า component ถูกลบไปแล้ว

        // 1. Check score against max (only if score is set and valid)
        if (score !== null && score !== undefined && score > comp.max) {
          issues.push(
            `${s.first_name} ${s.last_name}: "${comp.name}" มี ${score} / เต็ม ${comp.max}`
          );
        }
      }

      // 2. total check
      if ((s.total ?? 0) > 100) {
        issues.push(
          `${s.first_name} ${s.last_name}: คะแนนรวม ${s.total} (ควร ≤100)`
        );
      }
    }

    return issues;
  };

  /* -------- บันทึก -------- */
  const handleSave = async (): Promise<void> => {
    if (!selectedClass) return;

    // 1. ตรวจสอบก่อนบันทึก
    const issues: string[] = validateBeforeSave();

    if (issues.length > 0) {
      // สร้างข้อความสรุป (จำกัดบรรทัดแรกๆ)
      const previewLines = issues.slice(0, 20);
      const moreCount = issues.length - previewLines.length;
      const message =
        previewLines.join("\n") +
        (moreCount > 0 ? `\n...และมีอีก ${moreCount} รายการ` : "");

      await showAlert({
        title: "พบข้อผิดพลาดก่อนบันทึก",
        message:
          "พบคะแนนที่ไม่สอดคล้องกับโครงสร้างคะแนนปัจจุบัน/คะแนนรวมเกิน 100:\n\n" +
          message +
          "\n\nกรุณาแก้ไขคะแนนก่อนทำการบันทึก",
        type: "alert",
      });

      return; // หยุดการบันทึก
    }

    // *** 1. จุดเริ่มต้นการทำงาน: แสดง Loading Overlay ***
    setIsSaving(true);
    setError("");
    
    try {
      const schemePayload: SaveSchemePayload = {
        id: schemeId ?? undefined,
        components: components.map((c, idx) => ({
          // ส่ง id ถ้าไม่ใช่ temp, ถ้าเป็น temp- ให้เป็น undefined ให้ server สร้าง id ใหม่
          id: c.id.startsWith("temp-") ? undefined : c.id,
          name: c.name.trim() || "ช่อง",
          max: c.max,
          position: idx,
        })),
      };

      const gradesPayload: SaveGradeItem[] = students.map((s) => ({
        studentId: s.id,
        components: components.map((c) => ({
          // ใช้ c.id (temp หรือจริง) เพื่อระบุว่าคะแนนนี้เป็นของ component ไหน
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
        const j = (await res.json().catch(() => null)) as SaveResponse | null;
        throw new Error(j?.error || "บันทึกคะแนนไม่สำเร็จ");
      }

      // --- กรณีสำเร็จ ---
      
      // 2. โหลดข้อมูลใหม่ (เพื่อให้ได้ component id จริงจาก temp id)
      // โหลดในขณะที่ Loading Overlay ยังทำงานอยู่
      await fetchStudentsAndScheme(selectedClass); 

      // 3. *** ปิด Loading Overlay ทันทีที่การบันทึกและโหลดข้อมูลเสร็จสิ้น ***
      // บรรทัดนี้ทำให้ Animation หยุดทันที ก่อน Alert จะโผล่
      setIsSaving(false); 

      // 4. แสดง Alert รอผู้ใช้กดปิด (Alert จะแสดงบนหน้าจอที่ไม่มี Overlay แล้ว)
      await showAlert({ title: "สำเร็จ", message: "บันทึกคะแนนเรียบร้อยแล้ว", type: "alert" });
      
    } catch (err: unknown) {
      // --- กรณีเกิดข้อผิดพลาด ---
      const msg =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      setError(msg);
      
      // 2. *** ปิด Loading Overlay ทันทีที่เกิดข้อผิดพลาด ***
      // บรรทัดนี้ทำให้ Animation หยุดทันที ก่อน Alert จะโผล่
      setIsSaving(false);
      
      // 3. แสดง Alert แจ้งข้อผิดพลาด (Alert จะแสดงบนหน้าจอที่ไม่มี Overlay แล้ว)
      await showAlert({ title: "เกิดข้อผิดพลาด", message: msg, type: "alert" });
      
    }
  };

  /* ===================== Loading & Error ===================== */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="p-6 bg-red-100 dark:bg-red-900 rounded-lg">
        <p className="text-red-500 dark:text-red-300 font-semibold">
          เกิดข้อผิดพลาด: {error}
        </p>
        <p className="text-sm text-red-700 dark:text-red-100 mt-2">
            โปรดลองเลือกห้องเรียนอื่น หรือรีโหลดหน้าจอ
        </p>
      </div>
    );

  /* ===================== UI ===================== */
  return (
    <div className="relative">
      {/* Saving Animation Overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center 
                        bg-black/20 backdrop-blur-sm transition-opacity duration-300 
                        rounded-xl cursor-wait"
        >
          {/* ส่วนนี้คือสิ่งที่แสดง: มีแค่ Spinner และข้อความ ไม่มีพื้นหลัง Card สีขาวแล้ว */}
          <div className="flex flex-col items-center p-8 space-y-4 transform scale-100 transition-transform">
            <div className="w-14 h-14 border-6 border-blue-500 border-t-transparent border-r-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-bold text-white dark:text-blue-400 text-shadow-lg">
              กำลังบันทึกคะแนน...
            </p>
            <p className="text-md text-white/80">
              โปรดรอจนกว่าจะเสร็จสิ้น
            </p>
          </div>
        </div>
      )}

      {/* ส่วนหัว */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-2 rounded-lg">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            บันทึกผลการเรียน
          </h1>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            วิชา:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {subjectName || "กำลังโหลด..."}
            </span>
          </p>

          {classes.length > 0 && (
            <div className="mt-2">
              <label htmlFor="classSelect" className="sr-only">
                เลือกห้อง
              </label>
              <select
                id="classSelect"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="
                  w-full sm:w-64 rounded-lg
                  border border-slate-300 bg-white text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 p-2
                "
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ตัวกำหนดส่วนคะแนน */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 mb-4 border-gray-200 dark:border-gray-700">
          <h2 className="font-extrabold text-xl text-gray-900 dark:text-gray-100">
            กำหนดส่วนคะแนน
          </h2>
          <button
            onClick={addComponent}
            disabled={isSaving}
            className="mt-3 sm:mt-0 bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition duration-150 shadow-md disabled:bg-emerald-400"
          >
            + เพิ่มช่องคะแนน
          </button>
        </div>

        {components.length === 0 ? (
          <p className="text-gray-500 mt-3 text-center py-4">
            ยังไม่มีช่องคะแนน — กด “+ เพิ่มช่องคะแนน” เพื่อเริ่มต้นกำหนดโครงสร้าง
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 w-1/2">
                    ชื่อช่อง
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 w-1/4">
                    คะแนนเต็ม
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 w-1/4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {components.map((c: ComponentItem) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100"
                  >
                    <td className="px-4 py-2">
                      <input
                        className="input-field w-full rounded-md border p-2 dark:bg-gray-700 dark:text-gray-100"
                        value={c.name}
                        disabled={isSaving}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateComponentName(c.id, e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input-field w-24 rounded-md border p-2 dark:bg-gray-700 dark:text-gray-100 text-center"
                        type="number"
                        min={1}
                        value={c.max}
                        disabled={isSaving}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateComponentMax(c.id, e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      {/* --- แก้ไขปุ่มลบช่องคะแนน --- */}
                      <button
                        onClick={() => void confirmRemoveComponent(c)}
                        disabled={isSaving}
                        className="
                          bg-red-500 text-white text-sm px-3 py-1 
                          rounded-lg font-medium shadow-sm 
                          hover:bg-red-600 transition duration-150 
                          disabled:bg-gray-400 flex items-center gap-1
                        "
                      >
                        <span aria-hidden="true">ลบช่องนี้</span>
                      </button>
                      {/* --------------------------- */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ตารางคะแนน */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 bg-gray-100 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase z-10 w-48"
                >
                  ชื่อ - สกุล
                </th>
                {components.map((c: ComponentItem) => (
                  <th
                    key={c.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap"
                  >
                    {c.name} (เต็ม {c.max})
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24"
                >
                  รวม 
                </th>
                <th
                  rowSpan={2}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20"
                >
                  เกรด
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.length > 0 ? (
                students.map((s: StudentRow) => {
                  const over: boolean = (s.total ?? 0) > 100;
                  return (
                    <tr
                      key={s.id}
                      className={
                        over
                          ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition duration-150"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                      }
                    >
                      <td className="sticky left-0 bg-white dark:bg-gray-800 px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100 z-10">
                        {s.first_name} {s.last_name}
                      </td>
                      {components.map((c: ComponentItem) => (
                        <td key={c.id} className="px-6 py-4">
                          <input
                            type="number"
                            className="input-field w-24 rounded-md border p-2 text-center dark:bg-gray-700 dark:text-gray-100"
                            min={0}
                            max={c.max}
                            value={s.componentScores?.[c.id] ?? ""}
                            disabled={isSaving}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleScoreChange(
                                s.id,
                                c.id,
                                e.target.value,
                                c.max
                              )
                            }
                            placeholder={`0-${c.max}`}
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4 font-extrabold text-center">
                        <span className={over ? "text-red-600" : "text-green-600 dark:text-green-400"}>
                          {s.total ?? 0}
                        </span>
                        {over && (
                          <span className="ml-2 text-xs text-red-500 dark:text-red-400 block sm:inline">
                            (เกิน)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-xl text-center">
                        {s.grade ?? "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={components.length + 3}
                    className="text-center py-10 text-gray-500 dark:text-gray-400"
                  >
                    ไม่พบนักเรียนในห้องนี้ หรือยังไม่มีการสอนในห้องนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ปุ่มบันทึก */}
      {students.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-inner">
          {anyOver100 && (
            <div className="text-red-600 dark:text-red-400 text-sm font-medium p-2 border border-red-300 dark:border-red-700 rounded-lg">
              <span className="font-bold">คำเตือน:</span> มีผู้เรียนที่คะแนนรวมเกิน 100 — โปรดแก้ไขก่อนบันทึก
            </div>
          )}
          <button
            onClick={() => void handleSave()}
            disabled={isSaving || anyOver100}
            className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-blue-700 transition duration-150 shadow-lg disabled:bg-gray-400 disabled:shadow-none"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
          </button>
        </div>
      )}
    </div>
  );
}
