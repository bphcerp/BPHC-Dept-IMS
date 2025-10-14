import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Course, CourseGroup } from "node_modules/lib/src/types/allocation";

const CourseGroups = () => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<Record<string, string[]>>({});
  const [removedCourseCodes, setRemovedCourseCodes] = useState<Record<string, string[]>>({});

  const { data: groups = [] } = useQuery(["courseGroups"], async () => {
    const response = await api.get<CourseGroup[]>("/allocation/course-groups/get");
    return response.data;
  });

  const { data: courses = [] } = useQuery(["courses"], async () => {
    const response = await api.get<Course[]>("/allocation/course/get");
    return response.data;
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
      },
      onError: () => toast.error("Failed to update group courses"),
    }
  );

  const handleCreateGroup = () => {
    if (!groupName) return toast.error("Group name cannot be empty");
    createGroupMutation.mutate({ name: groupName, description: groupDescription });
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
        setRemovedCourseCodes((prev) => {
          const cur = prev[groupId] || [];
          if (cur.includes(course.code)) return prev;
          return { ...prev, [groupId]: [...cur, course.code] };
        });
        setSelectedToAdd((prev) => {
          const cur = prev[groupId] || [];
          return { ...prev, [groupId]: cur.filter((c) => c !== course.code) };
        });
      } else {
        setRemovedCourseCodes((prev) => {
          const cur = prev[groupId] || [];
          return { ...prev, [groupId]: cur.filter((c) => c !== course.code) };
        });
      }
    } else {
      if (currentlyChecked) {
        setSelectedToAdd((prev) => {
          const cur = prev[groupId] || [];
          return { ...prev, [groupId]: cur.filter((c) => c !== course.code) };
        });
      } else {
        setSelectedToAdd((prev) => {
          const cur = prev[groupId] || [];
          if (cur.includes(course.code)) return prev;
          return { ...prev, [groupId]: [...cur, course.code] };
        });
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
    updateGroupCoursesMutation.mutate({ groupId, courseCodes, removedCourseCodes: removed });
  };

  return (
    <div className="space-y-8 p-6">
      <Card className="border border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Create a New Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card className="border border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Manage Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.length === 0 ? (
            <p className="text-muted-foreground">No groups created yet.</p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="border rounded-2xl p-4 shadow-sm bg-card">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Select Courses</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {courses.map((course) => (
                      <div
                        key={course.code}
                        className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition"
                      >
                        <Checkbox
                          checked={isChecked(group.id, course)}
                          onCheckedChange={() => handleCourseToggle(group.id, course)}
                        />
                        <span className="text-sm truncate">{course.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleUpdateGroupCourses(group.id)}
                    className="mt-2 w-full"
                    disabled={updateGroupCoursesMutation.isLoading}
                  >
                    {updateGroupCoursesMutation.isLoading ? "Updating..." : "Update Group Courses"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGroups;