import { useState } from "react";
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
import api from "@/lib/axios-instance"; // Import Axios instance

interface RequestData {
  dcaMember: string;
  courseNo: string;
  courseName: string;
  fic: string;
  ficDeadline: string; // ISO date string
  faculty1: string;
  faculty2: string;
  reviewDeadline: string; // ISO date string
}




// Define the props type for the component
interface CreateRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequest: (data: RequestData) => void;
}

const CreateRequestDialog = ({
  isOpen,
  onClose,
  onAddRequest,
}: CreateRequestDialogProps) => {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [fic, setFIC] = useState("");
  const [ficDeadline, setFicDeadline] = useState<string | null>(null);
  const [srDeadline, setSrDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Loading state

  const handleAdd = async () => {
    if (!courseName || !courseCode || !fic) {
      alert("Please fill in all fields.");
      return;
    }

    const requestData: RequestData = {
      dcaMember: "DCA Member",
      courseNo: courseCode,
      courseName: "Course Name",
      fic: fic,
      faculty1: "Faculty Reviewer 1",
      faculty2: "Faculty Reviewer 2",
      ficDeadline: ficDeadline ?? new Date(Date.now()).toISOString(),
      reviewDeadline: srDeadline ?? new Date(Date.now()).toISOString(),
    };

    try {
      setLoading(true); // Start loading
      const response = await api.post("/qp/createQpRequest", requestData);
      
      console.log("Full API Response:", response); // 🔍 Log full response
      console.log("Response Data:", response.data); // 🔍 Log response data

      if (response.status === 201) {
        onAddRequest(response.data); // Add new request from backend
        onClose(); // Close dialog
      }
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setLoading(false); // Stop loading
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
                <SelectItem value="Prof. Harish V Dixit">
                  Prof. Harish V Dixit
                </SelectItem>
                <SelectItem value="Prof. SK Aziz Ali">
                  Prof. SK Aziz Ali
                </SelectItem>
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
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? "Submitting..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRequestDialog;
