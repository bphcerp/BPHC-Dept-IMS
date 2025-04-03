"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseItem from "@/components/qp_review/CourseItem";
import api from "@/lib/axios-instance";

export default function ReviewPage() {
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [reviewedCourses, setReviewedCourses] = useState<Course[]>([]);
  const facultyEmail = "harishdixit@university.com";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get(
          `/qp/getAllFacultyRequests/${encodeURIComponent(facultyEmail)}`
        );

        const data = response.data

        console.log(data)

        if (data.success) {
          const pending = data.data.filter(
            (req: any) => req.status === "pending"
          );
          const reviewed = data.data.filter(
            (req: any) => req.status === "approved"
          );

          setPendingCourses(
            pending.map((req: any) => ({
              id: req.id,
              code: req.code,
              DCA: `${req.DCA}`,
              role: `${req.role}`,
              timeLeft: req.timeLeft || "N/A",
              status: req.status,
            }))
          );

          setReviewedCourses(
            reviewed.map((req: any) => ({
              id:req.id,
              code: req.courseCode,
              DCA: ` ${req.dcaName}`,
              role: ` ${req.ficName}`,
              timeLeft: req.deadline || "Approved",
              status: req.status,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching faculty requests:", error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="w-full bg-background pt-6">
      <div className="mx-4">
        <QPReviewList
          pendingCourses={pendingCourses}
          reviewedCourses={reviewedCourses}
        />
      </div>
    </div>
  );
}

interface Course {
  id: number;
  code: string;
  DCA: string;
  role: string;
  timeLeft: string;
  status: string;
}

function QPReviewList({
  pendingCourses,
  reviewedCourses,
}: {
  pendingCourses: Course[];
  reviewedCourses: Course[];
}) {
  return (
    <div className="rounded-lg border bg-white shadow-sm w-full">
      <div className="p-6">
        <h2 className="mb-4 text-xl font-semibold">QP To Review</h2>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6 grid w-[200px] grid-cols-2 bg-gray-200">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            <div className="space-y-4">
              {pendingCourses.map((course, index) => (
                <CourseItem key={index} course={course} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviewed" className="mt-0">
            <div className="space-y-4">
              {reviewedCourses.map((course, index) => (
                <CourseItem key={index} course={course} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
