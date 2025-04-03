import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CourseItemProps {
  course: {
    id: number;
    code: string;
    DCA: string;
    role: string;
    timeLeft: string;
    status: string;
  };
}

export default function CourseItem({ course }: CourseItemProps) {
  const router = useNavigate();
  const courseCode = course.code;
  const requestId = course.id;
  console.log(requestId)
  const slug = encodeURIComponent(
    courseCode.toLowerCase().replace(/\s+/g, "-")
  );

  return (
    <div
      className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-200"
      onClick={() =>
        router(`/qpReview/FacultyReview/${slug}`, { state: { courseCode, requestId } })
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{courseCode}</h3>
          <p className="text-sm text-muted-foreground">{course.DCA}</p>
          <p className="text-sm text-muted-foreground">{course.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm",
              course.status === "reviewed" &&
                course.timeLeft === "DCA Approval Pending" &&
                "text-orange-500",
              course.status === "reviewed" &&
                course.timeLeft === "Approved" &&
                "text-green-500",
              course.status === "pending" && "text-muted-foreground"
            )}
          >
            {course.timeLeft}
          </span>
          {course.status === "reviewed" &&
            course.timeLeft === "DCA Approval Pending" && (
              <span className="h-2 w-2 rounded-full bg-orange-500" />
            )}
          {course.status === "reviewed" && course.timeLeft === "Approved" && (
            <span className="h-2 w-2 rounded-full bg-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}
