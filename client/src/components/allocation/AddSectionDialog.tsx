import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import {
  AllocationFormTemplatePreferenceFieldType,
  PreferredFaculty,
} from "node_modules/lib/src/types/allocationFormBuilder";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { SectionClient } from "node_modules/lib/src/types/allocation";
import api from "@/lib/axios-instance";
import { Faculty } from "node_modules/lib/src/types/inventory";
import { PhdStudent } from "node_modules/lib/src/schemas/Phd";

interface AddSectionDialogProps {
  isDialogOpen: boolean;
  setSections: React.Dispatch<React.SetStateAction<SectionClient[]>>;
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
  const [type, setType] =
    useState<AllocationFormTemplatePreferenceFieldType>("LECTURE");
  const [instructors, setInstructors] = useState<[string, string][]>([]);
  const [fetchAllFaculty, setFetchAllFaculty] = useState(false);
  const [fetchAllPhD, setFetchAllPhD] = useState(false);

  const currentPrefs =
    type === "LECTURE"
      ? lecturePrefs
      : type === "TUTORIAL"
        ? tutorialPrefs
        : practicalPrefs;

  const { data: facultyData } = useQuery({
    queryKey: ["allFaculty", fetchAllFaculty],
    queryFn: async () =>
      await api("/admin/member/getAllFaculty").then(
        ({ data }) => data as Faculty[]
      ),
    enabled: fetchAllFaculty,
  });

  const { data: phdData } = useQuery({
    queryKey: ["allPhD", fetchAllPhD],
    queryFn: async () =>
      await api("/admin/member/getAllPhD").then(
        ({ data }) => data as PhdStudent[]
      ),
    enabled: fetchAllPhD,
  });

  const handleCheck = (email: string, name: string) => {
    setInstructors((prev) => {
      const exists = prev.some(([e]) => e === email);
      return exists
        ? prev.filter(([e]) => e !== email)
        : [...prev, [email, name]];
    });
  };

  const handleSubmit = () => {
    setSections((el) => [...el, { type, instructors }]);
    setType("LECTURE");
    setInstructors([]);
    setFetchAllFaculty(false);
    setFetchAllPhD(false);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="flex max-w-xs flex-col border border-gray-300 bg-white text-black sm:max-w-xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Section</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-normal">
          <Label className="mr-4 font-medium">Select Section Type</Label>
          <Select
            value={type}
            onValueChange={(val) => {
              setType(val as AllocationFormTemplatePreferenceFieldType);
              setInstructors([]);
              setFetchAllFaculty(false);
              setFetchAllPhD(false);
            }}
          >
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
        <div className="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-normal">
          <Label className="mr-8 font-medium">Select Instructors</Label>
          <Popover>
            <PopoverTrigger
              disabled={
                !fetchAllFaculty &&
                !fetchAllPhD &&
                !currentPrefs.length &&
                !instructors.length
              }
            >
              <Button variant="outline" className="flex w-40 justify-between">
                <div>
                  {currentPrefs.length ||
                  instructors.length ||
                  fetchAllFaculty ||
                  fetchAllPhD
                    ? instructors.length > 0
                      ? "Modify..."
                      : "Select..."
                    : "No Instructors"}
                </div>
                {(!!currentPrefs.length ||
                  !!instructors.length ||
                  fetchAllFaculty ||
                  fetchAllPhD) && (
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
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
              {fetchAllFaculty &&
                facultyData &&
                facultyData
                  .filter(
                    ({ email }) =>
                      !currentPrefs.some(
                        (pref) => email === pref.submittedBy.email
                      )
                  )
                  .map(({ email, name }) => (
                    <div
                      key={email}
                      className="flex cursor-pointer items-center space-x-2 p-1"
                    >
                      <Checkbox
                        checked={instructors.some(([e]) => e === email)}
                        onCheckedChange={() => handleCheck(email, name!)}
                      />
                      <span>{name}</span>
                    </div>
                  ))}
              {fetchAllPhD &&
                phdData &&
                phdData
                  .filter(
                    ({ email }) =>
                      !currentPrefs.some(
                        (pref) => email === pref.submittedBy.email
                      )
                  )
                  .map(({ email, name }) => (
                    <div
                      key={email}
                      className="flex cursor-pointer items-center space-x-2 p-1"
                    >
                      <Checkbox
                        checked={instructors.some(([e]) => e === email)}
                        onCheckedChange={() => handleCheck(email, name!)}
                      />
                      <span>{name}</span>
                    </div>
                  ))}
            </PopoverContent>
          </Popover>
          <div className="flex space-x-2">
            <Checkbox
              checked={fetchAllFaculty}
              onCheckedChange={(checked) => setFetchAllFaculty(!!checked)}
            />
            <Label>Fetch All Instructors</Label>
            <Checkbox
              checked={fetchAllPhD}
              onCheckedChange={(checked) => setFetchAllPhD(!!checked)}
            />
            <Label>Fetch All PhD</Label>
          </div>
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
