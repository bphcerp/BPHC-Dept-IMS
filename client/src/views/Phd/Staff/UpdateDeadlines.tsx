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
import UpdateQualifyingExamDeadline from "../../../components/phd/StaffQualifyingExamDeadline";
// import UpdateProposalDeadline from "../../../components/phd/UpdateProposalDeadline";

interface Deadline {
  value: string;
  label: string;
  component: JSX.Element;
}
export default function UpdateDeadlinesPage() {
  const [selected, setSelected] = useState<Deadline | null>(null);

  // Navigation options
  const deadlines = [
    {
      value: "qualifying exam deadline",
      label: "Qualifying Exam Deadline",
      component: <UpdateQualifyingExamDeadline />,
    },
    // {
    //   value: "thesis proposal deadline",
    //   label: "Thesis Proposal Deadline",
    //   component: <UpdateProposalDeadline />,
    // },
  ];

  // Handle navigation when an option is clicked
  return (
    <div className="w-full bg-gray-100 py-8">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Update Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="mb-6 text-center text-muted-foreground">
              Select a category to update deadlines
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
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
      {selected?.component}
    </div>
  );
}
