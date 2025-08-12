import MasterScheduleView from '@/components/admin/MasterScheduleView';

export default function TeacherSchedulesPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold">ตารางสอนรวม</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">ภาพรวมตารางสอนของครูทุกคนในทุกห้องเรียน</p>
            <div className="mt-6">
                <MasterScheduleView />
            </div>
        </div>
    );
}