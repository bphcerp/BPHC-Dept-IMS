import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface ProjectItem {
  id: string;
  title: string;
  fundingAgencyId: string;
  fundingAgencyNature: string;
  sanctionedAmount: string;
  startDate: string;
  endDate: string;
  hasExtension: boolean;
  role?: string;
}

interface PatentItem {
  id: string;
  applicationNumber: string;
  title: string;
  department: string;
  campus: string;
  filingDate: string;
  status: string;
}

interface PublicationItem {
  citationId: string;
  title: string;
  journal?: string | null;
  month?: string | null;
  year: string;
  link?: string | null;
}

interface TabSwitcherProps {
  projects: ProjectItem[];
  patents: PatentItem[];
  publications: PublicationItem[];
}

export const TabSwitcher = ({ projects, patents, publications }: TabSwitcherProps) => (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-4xl">
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="w-full flex justify-center mb-4 bg-white rounded-lg shadow-sm p-1">
          <TabsTrigger value="projects" className="mx-2 px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Projects
          </TabsTrigger>
          <TabsTrigger value="patents" className="mx-2 px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Patents
          </TabsTrigger>
          <TabsTrigger value="publications" className="mx-2 px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            Publications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.length ? (
              projects.map((p) => (
                <Card key={p.id} className="p-8 shadow-md bg-background rounded-xl border border-gray-200 min-h-[200px]">
                  <div className="mb-2 text-base text-muted-foreground font-medium">{p.role}</div>
                  <div className="text-lg font-bold mb-2">{p.title}</div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div>Funding: <span className="font-semibold">{p.fundingAgencyNature}</span></div>
                    <div>Sanctioned: <span className="font-semibold">₹{p.sanctionedAmount}</span></div>
                    <div>
                      <span className="font-semibold">{p.startDate}</span> — <span className="font-semibold">{p.endDate}</span>
                    </div>
                    {p.hasExtension ? <div className="text-primary font-semibold">Extended</div> : null}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-muted-foreground text-center col-span-full">No projects found.</Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="patents">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {patents?.length ? (
              patents.map((p) => (
                <Card key={p.id} className="p-8 shadow-md bg-background rounded-xl border border-gray-200 min-h-[200px]">
                  <div className="text-lg font-bold mb-2">{p.title}</div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div>Application #: <span className="font-semibold">{p.applicationNumber}</span></div>
                    <div>Department: <span className="font-semibold">{p.department}</span></div>
                    <div>Campus: <span className="font-semibold">{p.campus}</span></div>
                    <div>Filed: <span className="font-semibold">{p.filingDate}</span></div>
                    <div>Status: <span className="font-semibold">{p.status}</span></div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-muted-foreground text-center col-span-full">No patents found.</Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="publications">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {publications?.length ? (
              publications.map((p) => (
                <Card key={p.citationId} className="p-8 shadow-md bg-background rounded-xl border border-gray-200 min-h-[200px]">
                  <div className="text-lg font-bold mb-2">{p.title}</div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    {p.journal ? <div>Journal: <span className="font-semibold">{p.journal}</span></div> : null}
                    <div>
                      {p.month ? <span className="font-semibold">{p.month}, </span> : null}
                      <span className="font-semibold">{p.year}</span>
                    </div>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-primary underline font-semibold">
                        View publication
                      </a>
                    ) : null}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-muted-foreground text-center col-span-full">No publications found.</Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

export type { ProjectItem, PatentItem, PublicationItem };

export default TabSwitcher;