import { Course } from "./types";

const mockCourses: Course[] = [
  { id: "1", courseCode: "CS F211", courseName: "Data Structures and Algorithms", credits: 4, instructor: "S. Patel" },
  { id: "2", courseCode: "EEE F214", courseName: "Electronic Devices", credits: 3, instructor: "C. Sharma" },
];

export const CourseLoadTable = () => {
  return (
    <div className="border rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              instructor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Credits
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {mockCourses.map((course) => (
            <tr key={course.id}>
              <td className="px-6 py-4 whitespace-nowrap"> {course.courseCode} </td>
              <td className="px-6 py-4 whitespace-nowrap"> {course.courseName} </td>
              <td className="px-6 py-4 whitespace-nowrap"> {course.instructor} </td>
              <td className="px-6 py-4 whitespace-nowrap"> {course.credits} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
