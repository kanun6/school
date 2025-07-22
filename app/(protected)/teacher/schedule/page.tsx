import ScheduleCalendar from "@/components/taecher/ScheduleCalendar";


export default function SchedulePage() {
    return (
        <div>
            <h1 className="text-3xl font-bold">จัดการตารางสอน</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                คลิกที่ช่องว่างในตารางเพื่อจองคาบสอนสำหรับวิชาของคุณ
            </p>
            <div className="mt-6">
                <ScheduleCalendar />
            </div>
        </div>
    );
}