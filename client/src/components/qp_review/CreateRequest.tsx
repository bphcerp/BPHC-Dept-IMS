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

interface RequestData {
  dcaMemberEmail: string;
  courseNo: string;
  courseName: string;
  fic: string;
  ficDeadline: Date;
  reviewDeadline: Date;
}

export interface Course {
  id: number;
  courseName: string;
  professor: string;
  reviewer1: string;
  reviewer2: string;
  status: string;
  reviewed: string;
}

interface CreateRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequest: (data: Course) => void;
  fetchCourses: () => Promise<void>;
  fics: any;
}

const CreateRequestDialog = ({
  isOpen,
  onClose,
  onAddRequest,
  fetchCourses,
  fics
}: CreateRequestDialogProps) => {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [fic, setFIC] = useState("");
  const [ficDeadline, setFicDeadline] = useState<string | null>(null);
  const [srDeadline, setSrDeadline] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!courseName || !courseCode || !fic) {
      alert("Please fill in all fields.");
      return;
    }
    createDCARequest();
  }

  useEffect(() => {
    fetchCourses();
    setCreated(false)
  },[created])

  const requestData: RequestData = {
    dcaMemberEmail: "dca@email.com",
    courseNo: courseCode,
    courseName: courseName,
    fic: fic,
    ficDeadline: ficDeadline ? new Date(ficDeadline) : new Date(),
    reviewDeadline: srDeadline ? new Date(srDeadline) : new Date(),
  };


   const createDCARequest = async () => {
    try {
      setLoading(true);
      const response = await api.post("/qp/createQpRequest", requestData);

      console.log("Full API Response:", response);
      console.log("Response Data:", response.data);

      if (response.status === 201) {
        onAddRequest(response.data);
        onClose();
      }
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create/Edit New Request</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>Course Name</p>
            <Select onValueChange={setCourseName}>
              <SelectTrigger>{courseName || "Select..."}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Analog Communication">
                  Analog Communication
                </SelectItem>
                <SelectItem value="Data Mining">Data Mining</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p>Course Code</p>
            <Select onValueChange={setCourseCode}>
              <SelectTrigger>{courseCode || "Select..."}</SelectTrigger>
              <SelectContent>
                <SelectItem value="ECE F341">ECE F341</SelectItem>
                <SelectItem value="CS F432">CS F432</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p>FIC</p>
            <Select onValueChange={setFIC}>
              <SelectTrigger>{fic || "Select..."}</SelectTrigger>
              <SelectContent>
                {fics.map((fic: any) => (
                  <SelectItem key={fic.email} value={fic.email}>
                    {fic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p>FIC Deadline</p>
            <Input
              type="date"
              onChange={(e) => setFicDeadline(e.target.value)}
            />
          </div>

          <div>
            <p>SR Deadline</p>
            <Input
              type="date"
              onChange={(e) => setSrDeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() =>{ void handleAdd()
          setCreated(true)
          }} disabled={loading}>
            {loading ? "Submitting..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRequestDialog;
