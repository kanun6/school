import Link from 'next/link';
import Image from 'next/image';
import type { ElementType } from 'react';
import { BookOpen, Calendar, BarChart2, Twitter, Instagram, Facebook } from 'lucide-react';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
    <Icon className="h-8 w-8 text-blue-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const NewsCard = ({
  imgSrc,
  title,
  date,
}: {
  imgSrc: string;
  title: string;
  date: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group">
    {/* ใช้ Image ของ Next.js แทน img เพื่อ optimize รูปภาพ */}
    <div className="relative w-full h-40">
      <Image
        src={imgSrc}
        alt={title}
        fill
        sizes="100vw"
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <section
        className="relative py-24 sm:py-32 flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative container mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            การเรียนอย่างมีประสิทธิภาพ
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">
            ระบบบริหารจัดการโรงเรียนที่เชื่อมต่อผู้บริหาร, คุณครู, และนักเรียนผ่านแพลตฟอร์มต่างๆ ได้อย่างลงตัว
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              ฟีเจอร์หลักของเรา
            </h2>
            <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
              เรามุ่งมั่นพัฒนาระบบเพื่อการบริหารโรงเรียนอย่างทั่วถึง
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Calendar}
              title="ระบบจัดการตารางสอน"
              description="ครูสามารถจัดตารางสอนของตัวเองได้อย่างอิสระ ในขณะที่นักเรียนและผู้ดูแลระบบสามารถดูภาพรวมทั้งหมดได้"
            />
            <FeatureCard
              icon={BookOpen}
              title="ระบบบันทึกผลการเรียน"
              description="บันทึกและติดตามผลการเรียนของนักเรียนได้อย่างง่ายดาย พร้อมระบบคำนวณเกรดอัตโนมัติ"
            />
            <FeatureCard
              icon={BarChart2}
              title="ระบบรายงานและแจ้งปัญหา"
              description="ช่องทางการสื่อสารที่มีประสิทธิภาพสำหรับนักเรียนและครูในการแจ้งปัญหาต่างๆ ให้ผู้ดูแลระบบรับทราบ"
            />
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              ข่าวสารและประกาศ
            </h2>
            <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
              ติดตามข่าวสารล่าสุดและประกาศสำคัญจากทางโรงเรียน
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* เปลี่ยน imgSrc ให้ไปที่รูปใน /public/news */}
            <NewsCard
              imgSrc="/news/news1.jpg"
              title="ประกาศเลื่อนสอบปลายภาค"
              date="15 พฤษภาคม 2567"
            />
            <NewsCard
              imgSrc="/news/news2.jpg"
              title="ประกาศวันหยุดทำการเรียน"
              date="10 พฤษภาคม 2567"
            />
            <NewsCard
              imgSrc="/news/news3.jpg"
              title="ประกาศผลการเรียนใหม่"
              date="7 พฤษภาคม 2567"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-blue-600 rounded-lg shadow-xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold">
              พร้อมสำหรับอนาคตของการจัดการโรงเรียนหรือยัง?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto">
              เข้าร่วมกับเราและยกระดับการบริหารจัดการโรงเรียนของคุณไปอีกขั้น
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 transition-colors"
              >
                ลงทะเบียนใช้งานฟรี
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-gray-400">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div>
              <h3 className="text-lg font-semibold text-white">SchoolSys</h3>
              <p className="mt-2 text-sm">ระบบบริหารจัดการโรงเรียนครบวงจร</p>
              <p className="text-sm">123 ถนนสุขุมวิท กรุงเทพ 10110</p>
              <p className="text-sm">contact@schoolsys.th</p>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-4">
              <a href="#" className="hover:text-white">
                <Twitter />
              </a>
              <a href="#" className="hover:text-white">
                <Instagram />
              </a>
              <a href="#" className="hover:text-white">
                <Facebook />
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm">
            <p>&copy; 2025 SchoolSys. สงวนลิขสิทธิ์.</p>
            <p>นโยบายความเป็นส่วนตัว | ข้อกำหนดในการให้บริการ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
