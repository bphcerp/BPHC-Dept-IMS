import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { allocationTypes } from "lib";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, Search } from "lucide-react";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { InstructorWithPreference } from "node_modules/lib/src/types/allocation";

interface AllocationHeaderProps {
  selectedCourse: allocationTypes.Course;
  semesterId: string;
  allocationData: allocationTypes.AllocationResponse | null;
  onAllocationChange: () => void;
  userTypeViewMode?: "faculty" | "phd";
}

const AllocationHeader: React.FC<AllocationHeaderProps> = ({
  selectedCourse,
  semesterId,
  allocationData,
  userTypeViewMode,
  onAllocationChange,
}) => {
  const [selectedIC, setSelectedIC] = useState<
    NonNullable<allocationTypes.AllocationResponse>["ic"] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Set initial IC when allocation data changes
  useEffect(() => {
    if (allocationData?.ic) {
      setSelectedIC(allocationData.ic);
    } else {
      setSelectedIC(null);
    }
  }, [allocationData]);

  // Fetch instructor list
  const { data: instructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: ["allocation", "instructors", selectedCourse.code],
    queryFn: async () => {
      const response = await api.get<InstructorWithPreference[]>(
        `/allocation/allocation/getInstructorListWithPref?code=${selectedCourse.code}&sectionType=LECTURE&userType=faculty`
      );
      return response.data;
    },
    onError: () => {
      toast.error("Failed to fetch instructor list");
    },
  });

  // Create allocation mutation
  const createAllocationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        semesterId,
        courseCode: selectedCourse.code,
        ic: selectedIC?.email,
        sections: [],
      };

      await api.post("/allocation/allocation/create", payload);
    },
    onSuccess: () => {
      toast.success(`Created allocation for ${selectedCourse.code}`);
      onAllocationChange();
    },
    onError: (error) => {
      toast.error("Failed to create allocation");
      console.error(error);
    },
  });

  // Update IC mutation
  const updateICMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        semesterId,
        courseCode: selectedCourse.code,
        ic: selectedIC!.email,
        sections: [],
      };

      await api.post("/allocation/allocation/create", payload);
    },
    onSuccess: () => {
      toast.success("Updated IC successfully");
      onAllocationChange();
    },
    onError: (error) => {
      toast.error("Failed to update IC");
      console.error(error);
    },
  });

  // Filter instructors based on search term
  const filteredInstructors = instructors.filter(
    (instructor) =>
      (instructor.name ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected instructor details
  const selectedInstructor = instructors.find(
    (instructor) => instructor.email === selectedIC?.email
  );

  const handleCreateOrUpdate = () => {
    if (allocationData) {
      if (!selectedIC) {
        throw new Error("Please select a value from the dropdown");
      }
      if (selectedIC.email === allocationData.ic?.email) {
        toast.info("Selected IC is the same as the current one");
        return;
      }
      updateICMutation.mutate();
    } else {
      createAllocationMutation.mutate();
    }
  };

  const isLoading_mutation =
    createAllocationMutation.isLoading || updateICMutation.isLoading;

  return (
    <div className="flex-shrink-0 border-b bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Course Info */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {selectedCourse.code}
          </Badge>
          <div className="text-sm font-semibold">{selectedCourse.name}</div>
        </div>

        {/* IC Selection and Action */}
        {userTypeViewMode === "faculty" && (
          <div className="flex items-center gap-3">
            {/* IC Dropdown */}
            {allocationData && !allocationData.ic && (
              <AlertTriangleIcon className="size-8 text-yellow-300" />
            )}
            <div className="w-80">
              <Select
                value={selectedIC?.email}
                onValueChange={(email) => {
                  const instructor = instructors.find(
                    (instructor) => instructor.email === email
                  );
                  setSelectedIC(instructor || { name: "Not found", email });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Instructor in Charge">
                    {selectedInstructor ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {selectedInstructor.name || "No Name"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Preference Given:{" "}
                          {selectedInstructor.preference ?? "Not Given"}
                        </span>
                      </div>
                    ) : (
                      "Select Instructor in Charge"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Search Input */}
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="h-8 pl-8"
                      />
                    </div>
                  </div>

                  {/* Instructors List */}
                  <div className="max-h-60 overflow-auto">
                    {instructorsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                      </div>
                    ) : filteredInstructors.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchTerm
                          ? "No instructors found"
                          : "No instructors available"}
                      </div>
                    ) : (
                      filteredInstructors.map((instructor) => (
                        <SelectItem
                          key={instructor.email}
                          value={instructor.email}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {instructor.name || "No Name"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Preference Given:{" "}
                              {instructor.preference ?? "Not Given"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Type:{" "}
                              {instructor.type === "phd" ? "PhD" : "Faculty"}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {!allocationData ||
            !allocationData?.ic ||
            (selectedIC && selectedIC.email !== allocationData.ic.email) ? (
              <Button
                onClick={handleCreateOrUpdate}
                disabled={isLoading_mutation}
                className="gap-2"
                variant={allocationData ? "outline" : "default"}
              >
                {allocationData
                  ? !!allocationData.ic
                    ? "Update IC"
                    : "Set IC"
                  : "Begin Allocation"}
              </Button>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationHeader;
