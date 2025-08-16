import { CourseLoadTable } from "@/components/allocation/CourseLoadTable";
// import { DataTable } from "@/components/shared/datatable/DataTable";

const CourseLoadPage = () => {
  return (
    <div className="p-4">
      <h1 className="test-2xl font-bold mb-4"> Course Load Allocation </h1>
      {/* <DataTable /> use this once we get the api setup */}
      <CourseLoadTable />
    </div>
  );
};

export default CourseLoadPage;
