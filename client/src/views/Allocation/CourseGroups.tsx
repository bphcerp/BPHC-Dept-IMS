import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Course, CourseGroup } from "node_modules/lib/src/types/allocation";

const CourseGroups = () => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const { data: groups = [] } = useQuery(["courseGroups"], async () => {
    const response = await api.get<CourseGroup[]>("/allocation/course-groups/get");
    return response.data;
  });

  const { data: courses = [] } = useQuery(["courses"], async () => {
    const response = await api.get<Course[]>("/allocation/course/get");
    return response.data;
  });

  const createGroupMutation = useMutation(
    async (name: string) => {
      await api.post("/allocation/course-groups/create", { name });
    },
    {
      onSuccess: () => {
        toast.success("Group created successfully");
        queryClient.invalidateQueries(["courseGroups"]);
        setGroupName("");
      },
      onError: () => {
        toast.error("Failed to create group");
      },
    }
  );

  const addCourseToGroupMutation = useMutation(
    async ({ groupId, courseCode } : {
        groupId: string;
        courseCode: string;
    }) => {
      await api.post(`/allocation/course-groups/${groupId}/courses`, { courseCode });
    },
    {
      onSuccess: () => {
        toast.success("Course added to group successfully");
        queryClient.invalidateQueries(["courseGroups"]);
        setSelectedCourse("");
      },
      onError: () => {
        toast.error("Failed to add course to group");
      },
    }
  );

  const handleCreateGroup = () => {
    if (!groupName) {
      toast.error("Group name cannot be empty");
      return;
    }
    createGroupMutation.mutate(groupName);
  };

  const handleAddCourseToGroup = (groupId: string) => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }
    addCourseToGroupMutation.mutate({ groupId, courseCode: selectedCourse });
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>Create a New Group</CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="group-name">Group Name</Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
          <Button onClick={handleCreateGroup}>Create Group</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Manage Groups</CardHeader>
        <CardContent className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="space-y-2">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedCourse}
                  onValueChange={(value) => setSelectedCourse(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.code} value={course.code}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => handleAddCourseToGroup(group.id)}>
                  Add Course
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGroups;