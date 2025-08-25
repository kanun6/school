import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  Globe,
  Languages,
  FlaskConical,
  Palette,
  Wrench,
  HeartPulse,
  Users2,
} from "lucide-react";

export const revalidate = 0;

type IconType = LucideIcon;

/** ---------------- Static descriptions (คงที่) ---------------- */
type StaticMeta = {
  icon: IconType;
  summary: string;
  topics: string[];
};

// map ด้วย “ชื่อวิชา” จากตาราง subjects ของคุณ
const SUBJECT_META_BY_NAME: Record<string, StaticMeta> = {
  สังคมศึกษา: {
    icon: Globe,
    summary:
      "ศึกษาประวัติศาสตร์ ภูมิศาสตร์ เศรษฐศาสตร์ ศาสนา และหน้าที่พลเมือง เพื่อเข้าใจสังคมและอยู่ร่วมกันอย่างรับผิดชอบ",
    topics: [
      "การใช้แผนที่และภูมิศาสตร์มนุษย์",
      "ประวัติศาสตร์ไทยและโลก",
      "เศรษฐกิจพื้นฐาน/การเงินส่วนบุคคล",
      "หน้าที่พลเมือง กฎหมาย และประชาธิปไตย",
    ],
  },
  คณิตศาสตร์: {
    icon: Calculator,
    summary:
      "พัฒนาความคิดเชิงตรรกะและการแก้ปัญหา ครอบคลุมเลขคณิต พีชคณิต เรขาคณิต สถิติ/ความน่าจะเป็น",
    topics: [
      "พีชคณิต สมการ/อสมการ ฟังก์ชัน",
      "เรขาคณิต พื้นที่ ปริมาตร เวกเตอร์",
      "สถิติและความน่าจะเป็น",
      "คณิตศาสตร์สำหรับชีวิตประจำวัน",
    ],
  },
  ภาษาอังกฤษ: {
    icon: Languages,
    summary:
      "ฝึกฟัง–พูด–อ่าน–เขียน เน้นสื่อสารได้จริง รวมคำศัพท์ ไวยากรณ์ และการอ่านเชิงวิเคราะห์",
    topics: [
      "การสื่อสารในชีวิตประจำวัน/เชิงวิชาการ",
      "ไวยากรณ์และโครงสร้างประโยค",
      "การอ่านจับใจความและสรุปความ",
      "การเขียนอีเมล รายงาน บทความ",
    ],
  },
  วิทยาศาสตร์: {
    icon: FlaskConical,
    summary:
      "หลักการฟิสิกส์ เคมี ชีววิทยา พร้อมกระบวนการสืบเสาะทางวิทยาศาสตร์และทักษะการทดลอง",
    topics: [
      "สสาร พลังงาน แรง และการเคลื่อนที่",
      "ปฏิกิริยาเคมี/โครงสร้างของสสาร",
      "สิ่งมีชีวิต ระบบนิเวศ พันธุกรรม",
      "วิธีวิทยาศาสตร์และความปลอดภัย",
    ],
  },
  ศิลปะ: {
    icon: Palette,
    summary:
      "สร้างสรรค์และชื่นชมงานศิลป์ ครอบคลุมทัศนศิลป์ ดนตรี นาฏศิลป์ และการออกแบบ",
    topics: [
      "องค์ประกอบศิลป์ สี รูปทรง",
      "วาดภาพ ระบายสี สื่อผสม",
      "ดนตรี/นาฏศิลป์และการแสดง",
      "วิจารณ์งานและแฟ้มสะสมผลงาน",
    ],
  },
  ภาษาไทย: {
    icon: BookOpen,
    summary:
      "พัฒนาทักษะการอ่าน เขียน ฟัง พูด อย่างถูกต้อง และซาบซึ้งวรรณคดีไทย",
    topics: [
      "หลักภาษาไทย การสะกด/วรรณยุกต์",
      "อ่านจับใจความและวิเคราะห์ข้อเขียน",
      "เขียนเรียงความ รายงาน จดหมาย",
      "วรรณคดีไทยและการตีความ",
    ],
  },
  การงานอาชีพและเทคโนโลยี: {
    icon: Wrench,
    summary:
      "ทักษะชีวิตและอาชีพ เน้นลงมือทำ งานบ้าน งานช่าง และพื้นฐานดิจิทัล/ไอที",
    topics: [
      "วางแผนงาน/โครงงานและทำงานเป็นทีม",
      "ทักษะดิจิทัล เอกสาร/สไลด์/ตารางคำนวณ",
      "พื้นฐานการเขียนโปรแกรม/ตรรกะ",
      "ความปลอดภัยไซเบอร์และมารยาทออนไลน์",
    ],
  },
  สุขศึกษา: {
    icon: HeartPulse,
    summary:
      "ดูแลสุขภาพกาย–ใจ โภชนาการ ออกกำลังกาย เพศศึกษา และความปลอดภัย",
    topics: [
      "โภชนาการและการวางแผนการกิน",
      "การออกกำลังกายและระบบร่างกาย",
      "สุขภาพจิต/การจัดการความเครียด",
      "เพศศึกษา/ป้องกันสารเสพติด/ความปลอดภัย",
    ],
  },
};

const DEFAULT_META: StaticMeta = { icon: BookOpen, summary: "ยังไม่มีคำอธิบายสำหรับรายวิชานี้", topics: [] };

type Row = { id: string; name: string; teacher_count: number };

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient();

  // ดึงจาก view เดียว ครบทั้งชื่อวิชาและจำนวนครู
  const { data, error } = await supabase
    .from("subject_teacher_counts")
    .select("id, name, teacher_count")
    .order("name");

  if (error) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-red-600">
          ไม่สามารถดึงรายวิชาได้: {error.message}
        </h1>
      </div>
    );
  }

  const subjects: Row[] = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="container mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              รายวิชาที่สอน
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            ดึงรายวิชาจากฐานข้อมูล และใช้คำอธิบาย/หัวข้อประกอบจากแคตตาล็อกคงที่
          </p>
        </header>

        {subjects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 dark:text-gray-400">
            ยังไม่มีรายวิชาในระบบ
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => {
              const meta = SUBJECT_META_BY_NAME[s.name] ?? DEFAULT_META;
              const Icon = meta.icon;

              return (
                <article
                  key={s.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {s.name}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {meta.summary}
                    </p>

                    {meta.topics.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                        {meta.topics.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                    )}

                    <div className="mt-4 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Users2 className="h-4 w-4" />
                      <span>ครูผู้สอน:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                        {s.teacher_count} คน
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}