const coreSubjects = [
    "ภาษาไทย",
    "คณิตศาสตร์",
    "วิทยาศาสตร์",
    "สังคมศึกษา",
    "สุขศึกษา",
    "ศิลปะ",
    "การงานอาชีพและเทคโนโลยี",
    "ภาษาอังกฤษ"
];

export default function SubjectsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold">จัดการรายวิชา</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                รายวิชาหลักในความรับผิดชอบ
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreSubjects.map((subject) => (
                    <div key={subject} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-lg">{subject}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
