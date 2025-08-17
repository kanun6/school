
import ContactForm from "@/components/contact/ContactForm";
import { Mail, Phone, MapPin, Clock, BookOpenCheck } from "lucide-react";

function InfoCard({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="mt-1.5 text-sm text-gray-700 dark:text-gray-300">
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 mb-4">
            <BookOpenCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ติดต่อเรา</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-3">
            มีคำถาม ข้อเสนอแนะ หรือสนใจใช้งาน SchoolSys — เรายินดีช่วยเสมอ
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <InfoCard icon={<Mail className="h-5 w-5" />} title="อีเมล" lines={["contact@schoolsys.th"]} />
          <InfoCard icon={<Phone className="h-5 w-5" />} title="โทรศัพท์" lines={["+66 2 123 4567", "จ.-ศ. 09:00–17:00 น."]} />
          <InfoCard icon={<MapPin className="h-5 w-5" />} title="ที่อยู่" lines={["123 ถ.การศึกษา เขตการเรียนรู้", "กรุงเทพฯ 10110"]} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5" /> เวลาให้บริการ
            </h3>
            <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>จันทร์–ศุกร์: 09:00–17:00 น.</li>
              <li>เสาร์–อาทิตย์/นักขัตฤกษ์: ปิดทำการ</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              นอกเวลาดังกล่าว กรุณาส่งอีเมลมาได้ เราจะติดต่อกลับโดยเร็วที่สุด
            </p>
          </div>

          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
