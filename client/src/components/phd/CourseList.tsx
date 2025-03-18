import React from "react";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
export interface Course {
  id: string;
  name: string;
  units: number;
  grade: string;
}
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
export function CourseList({
  courses,
  studentEmail,
}: {
  courses: Course[];
  studentEmail: string;
}) {
  const [studentCourses, setStudentCourses] = React.useState<Course[]>(courses);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [newGrade, setNewGrade] = React.useState("");
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setNewGrade(course.grade || "");
  };

  const handleConfirmEdit = () => {
    if (editingCourse) {
      setStudentCourses(
        studentCourses
          .map((course) =>
            course.id === editingCourse.id
              ? { ...course, grade: newGrade }
              : course
          )
          .map((course) => ({
            ...course,
            grade: course.grade ?? null,
          }))
      );
      setEditingCourse(null);
    }
  };
  const handleDelete = (id: string) => {
    setStudentCourses(studentCourses.filter((course) => course.id !== id));
  };

  const editMutation = useMutation({
    mutationFn: (courses: Course[]) => {
      return api.post("/phd/notionalSupervisor/updateCourseDetails", {
        studentEmail: studentEmail,
        courses,
      });
    },
    onSuccess: () => {
      toast.success("Courses updated successfully");
    },
    onError: () => {
      toast.error("Failed to update courses");
    },
  });
  const handleChanges = () => {
    editMutation.mutate(studentCourses);
  };
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
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {studentCourses.length > 0 ? (
            studentCourses.map((course) => (
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
                {course.grade != null ? (
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {course.grade}
                  </td>
                ) : (
                  <td className="whitespace-nowrap px-6 py-4 text-sm italic text-gray-500">
                    Not Graded
                  </td>
                )}
                <td className="flex flex-row gap-4 whitespace-nowrap px-2 py-4 text-sm text-gray-500">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(course)}
                        className="mr-2 text-blue-600 hover:text-blue-900"
                        aria-label={`Edit ${course.name}`}
                      >
                        <Pencil1Icon className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Edit Grade for {course.name}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter the new grade for this course.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Input
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        placeholder="Enter new grade"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmEdit}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-900"
                    aria-label={`Delete ${course.name}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
              >
                No courses found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {studentCourses != courses ? (
        <div className="flex flex-row gap-4">
          <Button
            onClick={() => {
              setStudentCourses(courses);
            }}
          >
            Discard Changes
          </Button>
          <Button onClick={handleChanges}>Save Changes</Button>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
