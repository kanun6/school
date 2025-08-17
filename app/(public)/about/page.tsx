import Link from "next/link";
import {
  BookOpenCheck,
  CalendarClock,
  Users2,
  ClipboardList,
  MessageSquare,
  Shield,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="container mx-auto px-6 py-12">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 mb-4">
            <BookOpenCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            เกี่ยวกับเรา
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            SchoolSys ถูกพัฒนาด้วยวิสัยทัศน์ในการยกระดับการจัดการโรงเรียน
            ให้เรียบง่าย โปร่งใส และมีประสิทธิภาพยิ่งขึ้น ด้วยเทคโนโลยีที่ใช้งานได้จริง
            ในทุกวันของครู นักเรียน และผู้บริหาร
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              เริ่มต้นใช้งาน
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ติดต่อเรา
            </Link>
          </div>
        </div>

        {/* What we solve */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            เราแก้ปัญหาอะไร
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            งานเอกสารกระจัดกระจาย ตารางสอนซ้ำซ้อน การติดตามผลการเรียนที่ล่าช้า
            และการสื่อสารที่ไม่เป็นระบบ คือสิ่งที่โรงเรียนส่วนใหญ่ต้องเผชิญ
            SchoolSys รวมทุกอย่างไว้ในที่เดียว เพื่อลดขั้นตอนที่ซ้ำซ้อน
            และช่วยให้ทุกฝ่ายทำงานร่วมกันได้ลื่นไหล
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mt-10">
          <FeatureCard
            icon={<CalendarClock className="h-5 w-5" />}
            title="จัดตารางสอนอัจฉริยะ"
            desc="วางตารางสอนหลากอัตราเรียน ลดชนกันของครู/ห้อง
            ดูภาพรวมทั้งโรงเรียนได้ในคลิกเดียว"
          />
          <FeatureCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="บันทึกผลการเรียน"
            desc="เก็บคะแนนเป็นระบบ เห็นพัฒนาการรายวิชา ส่งออกข้อมูลได้
            และลดความผิดพลาดจากการคีย์ซ้ำ"
          />
          <FeatureCard
            icon={<Users2 className="h-5 w-5" />}
            title="ข้อมูลบุคลากร & นักเรียน"
            desc="โครงสร้างข้อมูลเดียวกันทั้งโรงเรียน ค้นหาเร็ว
            จัดการสิทธิ์ตามบทบาทได้อย่างยืดหยุ่น"
          />
          <FeatureCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="สื่อสาร & แจ้งปัญหา"
            desc="ส่งประกาศ แจ้งงาน และระบบติดตามปัญหา
            เพื่อปิดงานได้ไวและตรวจสอบย้อนหลังได้"
          />
        </div>

        {/* Values */}
        <div className="grid gap-6 md:grid-cols-3 mt-12">
          <ValueCard
            title="ใช้งานง่ายจริง"
            desc="ออกแบบจากการทำงานของโรงเรียนจริง ลดปุ่มที่ไม่จำเป็น
            ให้ทำงานสำเร็จในขั้นตอนน้อยที่สุด"
          />
          <ValueCard
            title="ยืดหยุ่น & ขยายได้"
            desc="ปรับให้เข้ากับโครงสร้างโรงเรียนของคุณได้
            เพิ่มโมดูลใหม่เมื่อโรงเรียนเติบโต"
          />
          <ValueCard
            title="ความปลอดภัยมาก่อน"
            desc="จัดเก็บข้อมูลอย่างเป็นระบบ จัดการสิทธิ์ตามบทบาท
            และเข้ารหัสตามมาตรฐานสมัยใหม่"
            icon={<Shield className="h-4 w-4 text-blue-600 dark:text-blue-300" />}
          />
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            เริ่มใช้งานอย่างไร
          </h2>
          <ol className="mt-4 space-y-3 text-gray-700 dark:text-gray-300 list-decimal pl-6">
            <li>สมัครใช้งานและตั้งค่าข้อมูลโรงเรียน</li>
            <li>เพิ่มบุคลากร นักเรียน และห้องเรียน</li>
            <li>สร้างตารางสอน และกำหนดผู้สอนรายวิชา</li>
            <li>บันทึกผลการเรียนและติดตามรายงานได้ทันที</li>
          </ol>
        </div>

        {/* CTA bottom */}
        <div className="max-w-3xl mx-auto text-center mt-14">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              พร้อมยกระดับการบริหารโรงเรียนของคุณแล้วหรือยัง?
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              ลองใช้งานฟรี หรือคุยกับทีมของเราเพื่อวางแผนการปรับใช้ให้เหมาะกับโรงเรียน
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                ทดลองใช้งาน
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                นัดคุยกับทีมงาน
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Small presentational components ---------------- */

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function ValueCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 shadow-sm">
      {icon ? (
        <div className="mb-2 inline-flex">{icon}</div>
      ) : (
        <div className="mb-2 inline-flex h-4" />
      )}
      <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
