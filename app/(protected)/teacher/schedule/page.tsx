import ScheduleCalendar from "@/components/taecher/ScheduleCalendar";


export default function SchedulePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">จัดการตารางสอน</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    คลิกที่ช่องว่างในตารางเพื่อจองคาบสอนสำหรับวิชาของคุณ
                </p>
            </div>
            <ScheduleCalendar />
        </div>
    );
}