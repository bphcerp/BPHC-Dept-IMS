import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
const SupervisedStudents: React.FC = () => {
  const { data, isFetching } = useQuery({
    queryKey: ["phd-supervised-students"],
    queryFn: async () => {
      const response = await api.get<{ status: any }>(
        "/phd/supervisor/getSupervisedStudents"
      );
      console.log(response.data);
      return response.data?.status;
    },
  });
  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Supervised Students
      </h1>
      {data?.length > 0 ? (
        <div>
          {data.map((student: any) => (
            <div>
              <div>{student.name}</div>
              <div>{student.email}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>No students under your supervision yet.</div>
      )}
    </main>
  );
};
export default SupervisedStudents;
