"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseItem from "@/components/qp_review/CourseItem";

export default function ReviewPage() {
  const pendingCourses = [
    {
      code: "ECE F342",
      DCA: "DCA: MV Kumar",
      role: "FIC: Kumar H",
      timeLeft: "24 days left",
      status: "pending",
    },
    {
      code: "ECE F343",
      DCA: "DCA: MV Kumar",
      role: "FIC: Kumar B",
      timeLeft: "3 days left",
      status: "pending",
    },
    {
      code: "ECE F341",
      DCA: "DCA: MV Kumar",
      role: "FIC: Kumar K",
      timeLeft: "10 days left",
      status: "pending",
    },
  ];

  const reviewedCourses = [
    {
      code: "ECE F212",
      DCA: "DCA: Palaniappan",
      role: "FIC: Harishwar",
      timeLeft: "DCA Approval Pending",
      status: "reviewed",
    },
    {
      code: "ECE F241",
      DCA: "DCA: Girish",
      role: "FIC: Solomon",
      timeLeft: "Approved",
      status: "reviewed",
    },
  ];

  return (
    <div className="w-full bg-background pt-6">
      <div className="mx-auto max-w-4xl">
        <QPReviewList
          pendingCourses={pendingCourses}
          reviewedCourses={reviewedCourses}
        />
      </div>
    </div>
  );
}

interface Course {
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
    <div className="rounded-lg border bg-white shadow-sm">
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
