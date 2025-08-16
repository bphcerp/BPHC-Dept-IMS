import { CourseLoadTable } from "@/components/course_load/CourseLoadTable";

const CourseLoadPage = () => {
  return (
    <div className="p-4">
      <h1 className="test-2xl font-bold mb-4"> Course Load Allocation </h1>
      <CourseLoadTable />
    </div>
  );
};

export default CourseLoadPage;
