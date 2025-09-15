"use client";

import { useEffect, useState } from "react";
import SummaryCards from "@/components/admin/dashboard/SummaryCards";
import RolePieChart from "@/components/admin/dashboard/RolePieChart";
import UserGrowthChart from "@/components/admin/dashboard/UserGrowthChart";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import IssuesWidget from "@/components/admin/dashboard/IssuesWidget";
import ClassStatsChart from "@/components/admin/dashboard/ClassStatsChart";
import GradeStatsChart from "@/components/admin/dashboard/GradeStatsChart";
import SystemUsageChart from "@/components/admin/dashboard/SystemUsageChart";

type Role = "admin" | "teacher" | "student";

interface AdminUserOut {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  created_at: string | null;
}

interface ClassStats {
  className: string;
  studentCount: number;
}

interface GradeStats {
  gradeName: string;
  studentCount: number;
}

interface UsageData {
  date: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserOut[]>([]);
  const [issueStats, setIssueStats] = useState({
    ใหม่: 0,
    กำลังดำเนินการ: 0,
    แก้ไขแล้ว: 0,
  });
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [systemUsage, setSystemUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, issuesRes, classRes, gradeRes, usageRes] =
          await Promise.all([
            fetch("/api/admin/users"),
            fetch("/api/admin/issues/stats"),
            fetch("/api/admin/class-stats"),
            fetch("/api/admin/grade-stats"),
            fetch("/api/admin/system-usage"),
          ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (issuesRes.ok) setIssueStats(await issuesRes.json());
        if (classRes.ok) setClassStats(await classRes.json());
        if (gradeRes.ok) setGradeStats(await gradeRes.json());
        if (usageRes.ok) setSystemUsage(await usageRes.json());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading)
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

      {/* ข้อความ */}
      <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  );

  const total = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const teacherCount = users.filter((u) => u.role === "teacher").length;
  const studentCount = users.filter((u) => u.role === "student").length;

  // ✅ monthlyData: ผู้ใช้ใหม่รายเดือน
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthUsers = users.filter(
      (u) =>
        u.created_at &&
        new Date(u.created_at).getMonth() + 1 === month
    );
    return {
      month: `${month}`,
      admin: monthUsers.filter((u) => u.role === "admin").length,
      teacher: monthUsers.filter((u) => u.role === "teacher").length,
      student: monthUsers.filter((u) => u.role === "student").length,
    };
  });

  // ✅ recent: ผู้ใช้ล่าสุด
  const recent = users
    .filter((u) => u.created_at)
    .sort(
      (a, b) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
    )
    .map((u) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      role: u.role,
      created_at: u.created_at!,
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        ภาพรวมระบบ
      </h1>

      {/* แถว 1: Summary */}
      <SummaryCards
        total={total}
        admin={adminCount}
        teacher={teacherCount}
        student={studentCount}
      />

      {/* แถว 2: กราฟผู้ใช้ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">สัดส่วนผู้ใช้ตามบทบาท</h2>
          <RolePieChart
            admin={adminCount}
            teacher={teacherCount}
            student={studentCount}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">จำนวนผู้ใช้ใหม่รายเดือน</h2>
          <UserGrowthChart data={monthlyData} />
        </div>
      </div>

      {/* แถว 3: Recent + Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity users={recent} />
        <IssuesWidget stats={issueStats} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* แถว 4: Class Stats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">จำนวนนักเรียนต่อห้อง</h2>
        <ClassStatsChart data={classStats} />
      </div>

      {/* แถว 5: Grade Stats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">จำนวนนักเรียนรวมต่อชั้น</h2>
        <GradeStatsChart data={gradeStats} />
      </div>
      </div>

      {/* แถว 6: System Usage */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          การใช้งานระบบรายวัน
        </h2>
        <SystemUsageChart data={systemUsage} />
      </div>
    </div>
  );
}
