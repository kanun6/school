import type { SVGProps } from "react";
import {
  BookOpen,
  Calculator,
  Globe,
  Languages,
  FlaskConical,
  Palette,
  Wrench,
  HeartPulse,
} from "lucide-react";

export const metadata = {
  title: "รายวิชาที่สอน | SchoolSys",
};

type IconType = (props: SVGProps<SVGSVGElement>) => JSX.Element;

type SubjectInfo = {
  key: string;
  name: string;
  icon: IconType;
  summary: string;
  topics: string[]; // หัวข้อ/ทักษะหลักของรายวิชา
};

const SUBJECTS: SubjectInfo[] = [
  {
    key: "social",
    name: "สังคมศึกษา",
    icon: Globe,
    summary:
      "ศึกษาประวัติศาสตร์ ภูมิศาสตร์ เศรษฐศาสตร์ ศาสนา และหน้าที่พลเมือง เพื่อเข้าใจสังคมรอบตัวและอยู่ร่วมกันอย่างรับผิดชอบ",
    topics: [
      "การใช้แผนที่และภูมิศาสตร์มนุษย์",
      "ประวัติศาสตร์ไทยและโลก",
      "เศรษฐกิจพื้นฐาน การเงินส่วนบุคคล",
      "หน้าที่พลเมือง กฎหมาย และประชาธิปไตย",
    ],
  },
  {
    key: "math",
    name: "คณิตศาสตร์",
    icon: Calculator,
    summary:
      "พัฒนาความคิดเชิงตรรกะและการแก้ปัญหา ครอบคลุมเลขคณิต พีชคณิต เรขาคณิต สถิติ/ความน่าจะเป็น และแคลคูลัสเบื้องต้น",
    topics: [
      "พีชคณิต สมการ อสมการ ฟังก์ชัน",
      "เรขาคณิต พื้นที่ ปริมาตร เวกเตอร์",
      "สถิติ ความน่าจะเป็น และการตีความข้อมูล",
      "คณิตศาสตร์สำหรับชีวิตประจำวัน",
    ],
  },
  {
    key: "english",
    name: "ภาษาอังกฤษ",
    icon: Languages,
    summary:
      "ฝึกฟัง–พูด–อ่าน–เขียน เน้นสื่อสารได้จริง ครอบคลุมคำศัพท์ ไวยากรณ์ และการอ่านเชิงวิเคราะห์",
    topics: [
      "การสื่อสารในชีวิตประจำวัน/เชิงวิชาการ",
      "ไวยากรณ์และโครงสร้างประโยค",
      "การอ่านจับใจความและสรุปสาระ",
      "การเขียนอีเมล รายงาน และบทความ",
    ],
  },
  {
    key: "science",
    name: "วิทยาศาสตร์",
    icon: FlaskConical,
    summary:
      "เรียนรู้หลักการทางฟิสิกส์ เคมี ชีววิทยา พร้อมกระบวนการสืบเสาะทางวิทยาศาสตร์และทักษะการทดลอง",
    topics: [
      "สสาร พลังงาน แรง และการเคลื่อนที่",
      "ปฏิกิริยาเคมีและโครงสร้างของสสาร",
      "สิ่งมีชีวิต ระบบนิเวศ และพันธุกรรม",
      "วิธีวิทยาศาสตร์และความปลอดภัยในห้องทดลอง",
    ],
  },
  {
    key: "art",
    name: "ศิลปะ",
    icon: Palette,
    summary:
      "สร้างสรรค์และชื่นชมงานศิลป์ ครอบคลุมทัศนศิลป์ ดนตรี นาฏศิลป์ และการออกแบบ พัฒนาความคิดสร้างสรรค์และรสนิยม",
    topics: [
      "องค์ประกอบศิลป์ สี รูปทรง และการจัดวาง",
      "วาดภาพ ระบายสี สื่อผสม",
      "ดนตรี/นาฏศิลป์และการแสดง",
      "วิจารณ์งานและแฟ้มสะสมผลงาน (Portfolio)",
    ],
  },
  {
    key: "thai",
    name: "ภาษาไทย",
    icon: BookOpen,
    summary:
      "พัฒนาทักษะการอ่าน เขียน ฟัง พูด อย่างถูกต้อง และซาบซึ้งวรรณคดีวรรณกรรมไทย",
    topics: [
      "หลักภาษาไทย การสะกด การใช้วรรณยุกต์",
      "การอ่านจับใจความและวิเคราะห์ข้อเขียน",
      "การเขียนเรียงความ รายงาน และจดหมาย",
      "วรรณคดีไทยและการตีความเชิงวรรณศิลป์",
    ],
  },
  {
    key: "tech",
    name: "การงานอาชีพและเทคโนโลยี",
    icon: Wrench,
    summary:
      "ทักษะชีวิตและอาชีพ เน้นลงมือทำจริง ครอบคลุมงานบ้าน งานช่าง พื้นฐานดิจิทัล/ไอที และการทำโครงงาน",
    topics: [
      "การวางแผนงาน โครงงาน และการทำงานเป็นทีม",
      "ทักษะดิจิทัล เช่น เอกสาร ตารางคำนวณ นำเสนอ",
      "พื้นฐานการเขียนโปรแกรม/ตรรกะอัลกอริทึม (ถ้ามี)",
      "ความปลอดภัยไซเบอร์และมารยาทออนไลน์",
    ],
  },
  {
    key: "health",
    name: "สุขศึกษา",
    icon: HeartPulse,
    summary:
      "ดูแลสุขภาพกาย–ใจอย่างยั่งยืน ครอบคลุมโภชนาการ การออกกำลังกาย เพศศึกษา และความปลอดภัย",
    topics: [
      "โภชนาการและการวางแผนการกิน",
      "การออกกำลังกายและระบบร่างกาย",
      "สุขภาพจิต การจัดการความเครียด",
      "เพศศึกษา การป้องกันสารเสพติด และความปลอดภัย",
    ],
  },
];

export default function CoursesStaticPage() {
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
            หน้ารวมรายวิชาตามหลักสูตรของโรงเรียน พร้อมคำอธิบายและหัวข้อสำคัญของแต่ละวิชา
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SUBJECTS.map((s) => {
            const Icon = s.icon;
            return (
              <article
                key={s.key}
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
                    {s.summary}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                    {s.topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
