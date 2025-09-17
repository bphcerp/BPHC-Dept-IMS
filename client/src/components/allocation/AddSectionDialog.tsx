import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { PreferredFaculty } from "node_modules/lib/src/types/allocationFormBuilder";

interface AddSectionDialogProps {
  isDialogOpen: boolean;
  courseCode?: string;
  sections: Array<object>;
  lecturePrefs: PreferredFaculty[];
  tutorialPrefs: PreferredFaculty[];
  practicalPrefs: PreferredFaculty[];
}

const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  isDialogOpen,
  courseCode,
  sections,
  lecturePrefs,
  tutorialPrefs,
  practicalPrefs,
}) => {
  const [type, setType] = useState("Lecture");
  return (
    <Dialog open={isDialogOpen}>
      <DialogContent className="border border-gray-300 bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Section</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <Label className="mr-4 font-medium">Select Section Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LECTURE">Lecture</SelectItem>
              <SelectItem value="TUTORIAL">Tutorial</SelectItem>
              <SelectItem value="PRACTICAL">Practical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label className="mr-4 font-medium">Select Instructors</Label>
          {/* <Select value={type} onValueChange={setType}>
            <SelectTrigger className="">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LECTURE">Lecture</SelectItem>
              <SelectItem value="TUTORIAL">Tutorial</SelectItem>
              <SelectItem value="PRACTICAL">Practical</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog;
