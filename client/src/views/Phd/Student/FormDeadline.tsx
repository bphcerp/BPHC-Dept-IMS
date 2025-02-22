import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const FormDeadline: React.FC = () => {
  const formDeadlineOld = new Date("2022-12-31T23:59:59");
  const { data: formDeadline, isFetching } = useQuery({
    queryKey: ["phd-students"],
    queryFn: async () => {
      const response = await api.get<{ formDeadline: string }>(
        "/phd/notionalSupervisor/getPhd"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Qualifying Exam Form Deadline
        </h1>
        {
          isFetching ? (
            <span>Loading...</span>
          ) : (
            <span>{formDeadline?.formDeadline}</span>
          )
        }
      </div>
    </div>
  );
};

export default FormDeadline;
