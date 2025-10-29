import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import peopleData from "@/data/contributors.json";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";

type PeopleData = {
  professors: {
    department: string;
    name: string;
    imageUrl: string;
  }[];
  students: Record<
    string,
    {
      id: string;
      name: string;
      imageUrl: string;
      githubUsername: string;
    }
  >;
};

type GitHubUser = {
  login: string;
  id: number;
  contributions?: number;
  html_url: string;
};

type Contributor = {
  id: string;
  name: string;
  imageUrl: string;
  githubUsername: string;
  githubUrl: string;
  contributions?: number;
};

const ContributorsPage = () => {
  // First 5 top contributors and then sorted by ID
  const { professors, students } = peopleData as PeopleData;

  const { data: contributors = [] } = useQuery({
    queryKey: ["contributors"],
    queryFn: async () => {
      const { data: githubUsers } = await api.get<GitHubUser[]>("/contributors");
      const contributors: Contributor[] = Object.values(students).map((student) => {
        const user = githubUsers.find(
          (u) => u.login.toLowerCase() === student.githubUsername.toLowerCase()
        );
        return {
          id: student.id,
          name: student.name,
          imageUrl: student.imageUrl,
          githubUsername: student.githubUsername,
          githubUrl: user
            ? user.html_url
            : `https://github.com/${student.githubUsername}`,
          contributions: user?.contributions ?? 0,
        };
      });

      const sortedByContributions = [...contributors]
        .sort((a, b) => (b.contributions ?? 0) - (a.contributions ?? 0))
        .slice(0, 5);

      const remaining = contributors
        .filter(
          (c) =>
            !sortedByContributions.some(
              (top) =>
                top.githubUsername.toLowerCase() === c.githubUsername.toLowerCase()
            )
        )
        .sort((a, b) => a.id.localeCompare(b.id));

      return [...sortedByContributions, ...remaining];
    },
    staleTime: 1000 * 60 * 60,
  });

  return (
    <>
      <AppSidebar items={[]} />
      <div className="flex min-h-screen w-full flex-col">
        <div className="border-b bg-background p-4">
          <h1 className="text-2xl font-semibold">Contributors</h1>
        </div>
        <div className="flex-1 p-6">
          <div className="mb-12">
            <div className="mb-4 flex flex-col items-center space-y-2 text-center text-primary">
              <h1 className="text-3xl font-semibold tracking-tight">
                Information Management Service (IMS)
              </h1>
              <h2 className="text-lg text-muted-foreground">
                An initiative by the Departments of Electrical & Electronics
                Engineering and Mechanical Engineering, BITS Pilani Hyderabad
                Campus
              </h2>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Conceptualized and Designed by
              </h3>
            </div>

            <div className="mb-10 flex justify-center space-x-10">
              {professors.map((prof) => (
                <Card
                  key={prof.name}
                  className="flex w-96 flex-col items-center justify-center py-8"
                >
                  <CardContent className="flex flex-col items-center justify-center p-0">
                    <Avatar className="mb-4 h-28 w-28">
                      <img
                        src={prof.imageUrl}
                        alt={prof.name}
                        className="h-28 w-28 rounded-full object-cover object-center"
                      />
                    </Avatar>
                    <div className="text-center text-lg font-medium text-foreground">
                      {prof.name}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {prof.department}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="mb-4 text-xl font-semibold">Developers</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {contributors.map((person) => (
                <a
                  key={person.id}
                  href={person.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl transition-shadow hover:shadow-lg"
                >
                  <Card className="flex h-full flex-col items-center justify-center py-8">
                    <CardContent className="flex flex-col items-center justify-center p-0">
                      <Avatar className="mb-4 h-28 w-28">
                        <img
                          src={person.imageUrl}
                          alt={person.name}
                          className="h-28 w-28 rounded-full object-cover object-center"
                        />
                      </Avatar>
                      <div className="text-center text-lg font-medium text-foreground">
                        {person.name}
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {person.id}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContributorsPage;