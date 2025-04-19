import React from "react";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const CoSupervisedStudents: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["phd-co-supervised-students"],
    queryFn: async () => {
      const response = await api.get<{
        students: Array<{
          email: string;
          name: string;
          applicationStatus?: {
            status: "pending" | "approved" | "rejected";
            comments?: string | null;
            updatedAs?: string | null;
          } | null;
          qualifyingArea1?: string;
          qualifyingArea2?: string;
        }>;
      }>("/phd/coSupervisor/getCoSupervisedStudents");
      return response.data?.students;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Co-Supervised Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Qualifying Areas</TableHead>
                <TableHead>Proposal Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.qualifyingArea1} / {student.qualifyingArea2}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.applicationStatus?.status === "approved"
                            ? "default"
                            : student.applicationStatus?.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {student.applicationStatus?.status || "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center">
                    No students under your co-supervision yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
};

export default CoSupervisedStudents;
