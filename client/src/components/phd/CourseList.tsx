interface Course {
  id: string;
  name: string;
  units: number;
  grade: string;
}
export function CourseList({ courses }: { courses: Course[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Units
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Grade
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {courses.map((course) => (
            <tr key={course.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {course.id}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {course.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {course.units}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {course.grade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
