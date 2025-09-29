import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UpdateQualifyingExamDeadline from "@/components/phd/StaffQualifyingExamDeadline";
import StaffProposalDeadline from "@/components/phd/proposal/StaffProposalDeadline";

interface Deadline {
  value: string;
  label: string;
  component: JSX.Element;
}

export default function UpdateDeadlinesPage() {
  const [selected, setSelected] = useState<Deadline | null>(null);
  const deadlines: Deadline[] = [
    {
      value: "qualifying_exam_deadline",
      label: "Qualifying Exam Deadline",
      component: <UpdateQualifyingExamDeadline />,
    },
    {
      value: "proposal_deadline",
      label: "Proposal Deadline",
      component: <StaffProposalDeadline />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Update Deadlines</h1>
          <p className="mt-2 text-gray-600">
            {" "}
            Manage various academic deadlines{" "}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {" "}
              Select Deadline Type{" "}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                {" "}
                Select a category to update deadlines{" "}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-between"
                  >
                    {selected?.label ?? "Select a deadline"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {deadlines.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        setSelected(option);
                      }}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {selected?.component && (
          <div className="mt-8">{selected.component}</div>
        )}
      </div>
    </div>
  );
}
