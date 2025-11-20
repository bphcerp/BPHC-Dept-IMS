import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { contributionTypes } from "lib";

const HodReviewPage = () => {
  const queryClient = useQueryClient();

  const { data: contributions, isLoading } = useQuery<contributionTypes.FacultyContribution[]>({
    queryKey: ["contributions"],
    queryFn: async () => {
      const response = await api.get("/contribution/all");
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (contributionId: string) =>
      api.post("/contribution/approve", { contributionId }),
    onSuccess: () => {
      toast.success("Contribution approved successfully");
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
    onError: () => {
      toast.error("Failed to approve contribution");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (contributionId: string) =>
      api.post("/contribution/reject", { contributionId }),
    onSuccess: () => {
      toast.success("Contribution rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
    onError: () => {
      toast.error("Failed to reject contribution");
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Review Faculty Contributions</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Faculty Email</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributions?.map((contribution) => (
            <TableRow key={contribution.id}>
              <TableCell>{contribution.facultyEmail}</TableCell>
              <TableCell>{contribution.designation}</TableCell>
              <TableCell>
                {new Date(contribution.startDate).toLocaleDateString()} -{" "}
                {new Date(contribution.endDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{contribution.status}</TableCell>
              <TableCell>
                {contribution.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(contribution.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(contribution.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HodReviewPage;