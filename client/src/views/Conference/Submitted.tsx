import { conferenceSchemas } from "lib";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

const ConferenceSubmittedApplicationsView = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "submittedApplications"],
    queryFn: async () => {
      return (
        await api.get<conferenceSchemas.submittedApplicationsResponse>(
          "/conference/getSubmittedApplications"
        )
      ).data;
    },
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background-faded p-8">
      <h2 className="self-start text-3xl font-normal">
        Submitted Applications
      </h2>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading applications</p>}
      {data && (
        <Table>
          <TableCaption>Submitted Applications</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">{application.id}</TableCell>
                <TableCell>{application.status}</TableCell>
                <TableCell>{application.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ConferenceSubmittedApplicationsView;
