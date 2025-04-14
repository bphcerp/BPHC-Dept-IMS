import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import api from "@/lib/axios-instance";

export interface Course {
  id: number;
  courseName: string;
  professor: string;
  reviewer1: string;
  reviewer2: string;
  status: string;
  reviewed: string;
  courseNo?: string; // Adding these fields to match the requestData structure
  fic?: string;
  ficDeadline?: Date;
  reviewDeadline?: Date;
}

interface EditRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  fetchCourses: () => Promise<void>;
}

const EditRequestDialog = ({
  isOpen,
  onClose,
  course,
  fetchCourses,
}: EditRequestDialogProps) => {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [fic, setFIC] = useState("");
  const [ficDeadline, setFicDeadline] = useState<string | null>(null);
  const [srDeadline, setSrDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate form when course data is available
  useEffect(() => {
    if (course) {
      setCourseName(course.courseName || "");
      setCourseCode(course.courseNo || "");
      setFIC(course.fic || "");

      // Format dates if they exist
      // if (course.ficDeadline) {
      //   console.log(course.ficDeadline);
      //   const ficDate = new Date(course.ficDeadline);
      //   setFicDeadline(ficDate);
      // }

      // if (course.reviewDeadline) {
      //   const reviewDate = new Date(course.reviewDeadline);
      //   setSrDeadline(reviewDate);
      // }
    }
  }, [course]);

  const handleUpdate = async () => {
    

    const requestData = {
      id: course?.id,
      // dcaMemberEmail: "dca@email.com",
      // courseNo: courseCode,
      // courseName: courseName,
      // fic: fic,
      ficDeadline: ficDeadline ? new Date(ficDeadline) : new Date(),
      reviewDeadline: srDeadline ? new Date(srDeadline) : new Date(),
    };

    try {
      setLoading(true);
      const response = await api.put(
        `/qp/editQpRequest/${course?.id}`,
        requestData
      );

      console.log("Full API Response:", response);
      console.log("Response Data:", response.data);

      if (response.status === 200) {
        await fetchCourses();
        onClose();
      }
    } catch (error) {
      console.error("Error updating request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>FIC Deadline</p>
            <Input
              type="date"
              value={ficDeadline || ""}
              onChange={(e) => setFicDeadline(e.target.value)}
            />
          </div>

          <div>
            <p>SR Deadline</p>
            <Input
              type="date"
              value={srDeadline || ""}
              onChange={(e) => setSrDeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRequestDialog;
