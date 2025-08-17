"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";

export default function ContactForm() {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const subject = String(data.get("subject") || "ติดต่อจากเว็บไซต์ SchoolSys");
    const message = String(data.get("message") || "");

    const body =
      `ชื่อผู้ติดต่อ: ${name}\n` +
      `อีเมล: ${email}\n\n` +
      `${message}`;

    const mailto = `mailto:contact@schoolsys.th?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    form.reset();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="h-5 w-5" /> ส่งข้อความถึงเรา
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        กรอกแบบฟอร์มด้านล่าง ระบบจะเปิดอีเมลสำหรับส่งหาเราโดยอัตโนมัติ
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">ชื่อ–สกุล</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">อีเมล</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-gray-300">หัวข้อ</label>
          <input
            name="subject"
            className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-gray-300">ข้อความ</label>
          <textarea
            name="message"
            rows={5}
            required
            className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* honeypot ป้องกันบอทแบบง่าย ๆ */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="mt-4">
        <button
          type="submit"
          className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          ส่งข้อความ
        </button>
      </div>
    </form>
  );
}
