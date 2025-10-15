import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Course, CourseGroup } from "node_modules/lib/src/types/allocation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/shared/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";

const CourseGroups = () => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<Record<string, string[]>>(
    {}
  );
  const [removedCourseCodes, setRemovedCourseCodes] = useState<
    Record<string, string[]>
  >({});
  const [openDialog, setOpenDialog] = useState(false);
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null);
  const [filterPractical, setFilterPractical] = useState(false);
  const [filterTutorial, setFilterTutorial] = useState(false);

  const { data: groups = [] } = useQuery(["courseGroups"], async () => {
    const res = await api.get<CourseGroup[]>("/allocation/course-groups/get");
    return res.data;
  });

  const { data: courses = [] } = useQuery(["courses"], async () => {
    const res = await api.get<Course[]>("/allocation/course/get");
    return res.data;
  });

  useEffect(() => {
    const initSelected: Record<string, string[]> = {};
    const initRemoved: Record<string, string[]> = {};
    groups.forEach((g) => {
      initSelected[g.id] = [];
      initRemoved[g.id] = [];
    });
    setSelectedToAdd((prev) => ({ ...initSelected, ...prev }));
    setRemovedCourseCodes((prev) => ({ ...initRemoved, ...prev }));
  }, [groups]);

  const createGroupMutation = useMutation(
    async ({ name, description }: { name: string; description: string }) => {
      await api.post("/allocation/course-groups/create", { name, description });
    },
    {
      onSuccess: () => {
        toast.success("Group created successfully");
        queryClient.invalidateQueries(["courseGroups"]);
        setGroupName("");
        setGroupDescription("");
      },
      onError: () => toast.error("Failed to create group"),
    }
  );

  const updateGroupCoursesMutation = useMutation(
    async ({
      groupId,
      courseCodes,
      removedCourseCodes,
    }: {
      groupId: string;
      courseCodes: string[];
      removedCourseCodes: string[];
    }) => {
      await api.post(`/allocation/course-groups/add/${groupId}`, {
        courseCodes,
        removedCourseCodes,
      });
    },
    {
      onSuccess: () => {
        toast.success("Group courses updated successfully");
        queryClient.invalidateQueries(["courseGroups"]);
        queryClient.invalidateQueries(["courses"]);
        setSelectedToAdd({});
        setRemovedCourseCodes({});
        setOpenDialog(false);
      },
      onError: () => toast.error("Failed to update group courses"),
    }
  );

  const handleCreateGroup = () => {
    if (!groupName) return toast.error("Group name cannot be empty");
    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
    });
  };

  const isChecked = (groupId: string, course: Course) => {
    const originallyAssigned = course.groupId === groupId;
    const removedForGroup = removedCourseCodes[groupId] || [];
    const addedForGroup = selectedToAdd[groupId] || [];
    if (originallyAssigned) {
      return !removedForGroup.includes(course.code);
    }
    return addedForGroup.includes(course.code);
  };

  const handleCourseToggle = (groupId: string, course: Course) => {
    const currentlyChecked = isChecked(groupId, course);
    const originallyAssigned = course.groupId === groupId;
    if (originallyAssigned) {
      if (currentlyChecked) {
        setRemovedCourseCodes((prev) => ({
          ...prev,
          [groupId]: [...(prev[groupId] || []), course.code],
        }));
        setSelectedToAdd((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((c) => c !== course.code),
        }));
      } else {
        setRemovedCourseCodes((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((c) => c !== course.code),
        }));
      }
    } else {
      if (currentlyChecked) {
        setSelectedToAdd((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((c) => c !== course.code),
        }));
      } else {
        setSelectedToAdd((prev) => ({
          ...prev,
          [groupId]: [...(prev[groupId] || []), course.code],
        }));
      }
    }
  };

  const handleUpdateGroupCourses = (groupId: string) => {
    const courseCodes = selectedToAdd[groupId] || [];
    const removed = removedCourseCodes[groupId] || [];
    if (courseCodes.length === 0 && removed.length === 0) {
      toast.error("No changes to update");
      return;
    }
    updateGroupCoursesMutation.mutate({
      groupId,
      courseCodes,
      removedCourseCodes: removed,
    });
  };

  const handleSelectAll = (groupId: string, filteredCourses: Course[]) => {
    const selectedCodes = filteredCourses.map((c) => c.code);
    const alreadyAssigned = courses
      .filter((c) => c.groupId === groupId)
      .map((c) => c.code);
    setRemovedCourseCodes((prev) => ({ ...prev, [groupId]: [] }));
    const newAdds = selectedCodes.filter(
      (code) => !alreadyAssigned.includes(code)
    );
    setSelectedToAdd((prev) => ({ ...prev, [groupId]: newAdds }));
    toast.success(`All ${filteredCourses.length} courses selected`);
  };

  const columns: ColumnDef<CourseGroup>[] = [
    { accessorKey: "name", header: "Group Name" },
    { accessorKey: "description", header: "Description" },
    {
      accessorFn: () => "No. of Courses",
      header: "No. of Courses",
      cell: ({ row }) =>
        courses.filter((c) => c.groupId === row.original.id).length,
    },
    {
      accessorFn: () => "Actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActiveGroup(row.original);
            setOpenDialog(true);
          }}
        >
          View/Edit Courses
        </Button>
      ),
    },
  ];

  const filteredCourses = courses.filter((c) => {
    let pass = true;
    if (filterPractical) pass = pass && c.practicalUnits !== 0;
    if (filterTutorial)
      pass = pass && c.offeredTo === "FD" && c.offeredAs === "CDC";
    return pass;
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                />
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isLoading}
                className="w-full"
              >
                {createGroupMutation.isLoading ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={groups ?? []} />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="h-[90vh] w-[90%] max-w-[90%]">
          <DialogHeader>
            <DialogTitle>{activeGroup?.name}</DialogTitle>
          </DialogHeader>

          {activeGroup && (
            <>
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filterPractical}
                    onCheckedChange={(checked) =>
                      setFilterPractical(Boolean(checked))
                    }
                  />
                  <span>Has Practical</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filterTutorial}
                    onCheckedChange={(checked) =>
                      setFilterTutorial(Boolean(checked))
                    }
                  />
                  <span>Has Tutorial</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleSelectAll(activeGroup.id, filteredCourses)
                  }
                >
                  Select All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const allCodes = filteredCourses.map((c) => c.code);
                    setRemovedCourseCodes((prev) => ({
                      ...prev,
                      [activeGroup.id]: allCodes,
                    }));
                    setSelectedToAdd((prev) => ({
                      ...prev,
                      [activeGroup.id]: [],
                    }));
                  }}
                >
                  Remove All
                </Button>
              </div>

              <div className="grid max-h-[400px] grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course.code}
                    className="flex items-center space-x-2 rounded-md border p-2 transition hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={isChecked(activeGroup.id, course)}
                      onCheckedChange={() =>
                        handleCourseToggle(activeGroup.id, course)
                      }
                    />
                    <span className="truncate text-sm">{`${course.code} - ${course.name}`}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleUpdateGroupCourses(activeGroup.id)}
                disabled={updateGroupCoursesMutation.isLoading}
                className="mt-4 w-full"
              >
                {updateGroupCoursesMutation.isLoading
                  ? "Updating..."
                  : "Update Group Courses"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseGroups;
