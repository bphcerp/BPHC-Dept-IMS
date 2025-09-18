import React, { useEffect, useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

interface AddSectionDialogProps {
  isDialogOpen: boolean;
  setSections: React.Dispatch<
    React.SetStateAction<{ type: string; instructors: [string, string][] }[]>
  >;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lecturePrefs: PreferredFaculty[];
  tutorialPrefs: PreferredFaculty[];
  practicalPrefs: PreferredFaculty[];
}

const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  setSections,
  lecturePrefs,
  tutorialPrefs,
  practicalPrefs,
}) => {
  const [type, setType] = useState<string>("LECTURE");
  const [instructors, setInstructors] = useState<[string, string][]>([]);
  const [currentPrefs, setCurrentPrefs] = useState<PreferredFaculty[]>([]);
  const prevType = useRef(type);
  useEffect(() => {
    if (prevType.current !== type) {
      setInstructors([]);
      setCurrentPrefs(
        type === "LECTURE"
          ? lecturePrefs
          : type === "TUTORIAL"
            ? tutorialPrefs
            : practicalPrefs
      );
      prevType.current = type;
    }
  }, [type, lecturePrefs, tutorialPrefs, practicalPrefs]);
  console.log(currentPrefs);
  const handleCheck = (email: string, name: string) => {
    setInstructors((prev) => {
      const exists = prev.some(([e]) => e === email);
      if (exists) {
        return prev.filter(([e]) => e !== email);
      }
      return [...prev, [email, name]];
    });
  };
  const handleSubmit = () => {
    setSections((el) => [...el, { type, instructors: instructors }]);
    setType("LECTURES");
    setInstructors([]);
    setIsDialogOpen(false);
  };
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="flex flex-col border border-gray-300 bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Section</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <Label className="mr-4 font-medium">Select Section Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40">
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
          <Label className="mr-8 font-medium">Select Instructors</Label>
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" className="flex w-40 justify-between">
                <div>{instructors.length > 0 ? "Modify..." : "Select..."}</div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              {currentPrefs.map((pref) => (
                <div
                  key={pref.submittedBy.email}
                  className="flex cursor-pointer items-center space-x-2 p-1"
                >
                  <Checkbox
                    checked={instructors.some(
                      ([e]) => e === pref.submittedBy.email
                    )}
                    onCheckedChange={() =>
                      handleCheck(
                        pref.submittedBy.email,
                        pref.submittedBy.name || ""
                      )
                    }
                  />
                  <span>{pref.submittedBy.name}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-end">
          <Button className="px-4" onClick={handleSubmit}>
            Add Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog;
