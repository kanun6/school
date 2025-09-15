'use client';

import React, { useState, useEffect } from "react";
import { Issue } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";

type IssueStatus = "ใหม่" | "กำลังดำเนินการ" | "แก้ไขแล้ว";

export default function ReportPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<IssueStatus>("ใหม่");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { showConfirm, showAlert } = useModal();

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data = await res.json();
      setIssues(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchIssues();

    const supabase = createClient();
    const channel = supabase
      .channel("public:issues:admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    try {
      const res = await fetch("/api/issues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, status }),
      });
      if (!res.ok) throw new Error("ไม่สามารถเปลี่ยนสถานะได้");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      await showAlert({ title: "เกิดข้อผิดพลาด", message, type: "alert" });
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    const confirmed = await showConfirm({
      title: "ยืนยันการลบ",
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบปัญหานี้อย่างถาวร?",
      confirmText: "ลบ",
    });

    if (confirmed) {
      try {
        const res = await fetch("/api/issues", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueId }),
        });
        if (!res.ok) throw new Error("ไม่สามารถลบได้");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        await showAlert({ title: "เกิดข้อผิดพลาด", message, type: "alert" });
      }
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );
  if (error) return <p className="text-red-500">{error}</p>;

  const filteredIssues = issues.filter((i) => i.status === activeTab);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">เรื่องร้องเรียน</h1>

      {/* แถบแท็บสถานะ */}
      <div className="flex border-b dark:border-gray-700 mb-6">
        {(["ใหม่", "กำลังดำเนินการ", "แก้ไขแล้ว"] as IssueStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 font-medium",
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ตารางปัญหา */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ผู้รายงาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                วันที่แจ้ง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <React.Fragment key={issue.id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {issue.title}
                      </div>
                      {/* ปุ่มดูรายละเอียด */}
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === issue.id ? null : issue.id)
                        }
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {expandedId === issue.id ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issue.reported_by?.first_name || "ไม่ทราบ"} (
                      {issue.reported_by?.role})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          handleStatusChange(issue.id, e.target.value as IssueStatus)
                        }
                        className={cn(
                          "select-field font-semibold",
                          issue.status === "ใหม่" && "text-blue-600",
                          issue.status === "กำลังดำเนินการ" && "text-yellow-600",
                          issue.status === "แก้ไขแล้ว" && "text-green-600"
                        )}
                      >
                        <option>ใหม่</option>
                        <option>กำลังดำเนินการ</option>
                        <option>แก้ไขแล้ว</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteIssue(issue.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* แถวรายละเอียดเพิ่มเติม */}
                  {expandedId === issue.id && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <p>
                          <span className="font-semibold">หมวดหมู่:</span>{" "}
                          {issue.category}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold">รายละเอียด:</span>{" "}
                          {issue.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  ไม่มีข้อมูลในสถานะนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
