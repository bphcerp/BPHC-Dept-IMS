import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdateDeadlinesPage() {
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] =
    useState<string>("Select a deadline");

  // Navigation options
  const navigationOptions = [
    {
      value: "qualifying exam deadline",
      label: "Qualifying Exam Deadline",
      url: "qualifying-exam-deadline",
    },
    {
      value: "thesis proposal deadline",
      label: "Thesis Proposal Deadline",
      url: "thesis-proposal-deadline",
    },
  ];

  // Handle navigation when an option is clicked
  const handleNavigation = (url: string, label: string) => {
    setSelectedLabel(label);
    navigate(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
                  {selectedLabel}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {navigationOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleNavigation(option.url, option.label)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedLabel !== "Select a deadline" && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Navigating to {selectedLabel}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
