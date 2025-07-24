import ClassScheduleView from '@/components/admin/ClassScheduleView';

export default function ClassSchedulesPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold">ตารางเรียนตามห้อง</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">เลือกห้องเรียนเพื่อดูตารางเรียนของห้องนั้นๆ</p>
            <div className="mt-6">
                <ClassScheduleView />
            </div>
        </div>
    );
}