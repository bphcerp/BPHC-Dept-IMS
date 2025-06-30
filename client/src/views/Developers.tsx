// src/pages/ProfilePage.tsx (or wherever you keep your page components)
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

const isContributor = (obj: unknown): obj is Contributor => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "number" &&
    typeof (obj as Record<string, unknown>).login === "string" &&
    typeof (obj as Record<string, unknown>).avatar_url === "string" &&
    typeof (obj as Record<string, unknown>).html_url === "string" &&
    typeof (obj as Record<string, unknown>).contributions === "number"
  );
};

// Optional: Map GitHub usernames to custom display names
const nameOverrides: Record<string, string> = {
  // "github_username": "Custom Name",
};

const fetchContributors = async (): Promise<Contributor[]> => {
  const res = await api.get("/developers");
  const data: unknown = res.data;
  if (Array.isArray(data)) {
    return data.filter(isContributor);
  }
  return [];
};

const DevelopersPage = () => {
  const {
    data: contributors = [],
    isLoading,
    isError,
  } = useQuery<Contributor[]>({
    queryKey: ["githubContributors"],
    queryFn: fetchContributors,
  });

  return (
    <>
      <AppSidebar items={[]} />
      <div className="flex min-h-screen w-full flex-col">
        <div className="border-b bg-background p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Developers</h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          {isLoading && (
            <div className="text-center text-muted-foreground">Loading...</div>
          )}
          {isError && (
            <div className="text-center text-destructive">
              Failed to load contributors.
            </div>
          )}
          {!isLoading && !isError && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {contributors.map((contrib) => (
                <a
                  key={contrib.id}
                  href={contrib.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl transition-shadow hover:shadow-lg"
                >
                  <Card className="flex h-full flex-col items-center justify-center py-8">
                    <CardContent className="flex flex-col items-center justify-center p-0">
                      <Avatar className="mb-4 h-28 w-28">
                        <img
                          src={contrib.avatar_url}
                          alt={contrib.login}
                          className="h-28 w-28 rounded-full"
                        />
                      </Avatar>
                      <div className="text-center text-lg font-medium text-foreground">
                        {nameOverrides[contrib.login] || contrib.login}
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {contrib.contributions} contributions
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DevelopersPage;
