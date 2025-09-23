import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import api from "@/lib/axios-instance";
import { Loader2 } from "lucide-react";

const fetchFacultyList = async (): Promise<
  { authorId: string; name: string }[]
> => {
  const response = await api.get<{ authorId: string; name: string }[]>(
    "/analytics/publications/faculty"
  );
  return response.data;
};

interface Props {
  onSubmit: (filters: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    grouping: "monthly" | "yearly";
    authorIds: string[];
  }) => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2008 + 1 }, (_, i) => 2008 + i);
};

// eslint-disable-next-line react/prop-types
export const AnalyticsFilters: React.FC<Props> = ({ onSubmit }) => {
  const { data: faculty, isLoading } = useQuery({
    queryKey: ["faculty:list"],
    queryFn: fetchFacultyList,
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based

  const [filters, setFilters] = useState({
    startMonth: 1,
    startYear: 2010,
    endMonth: currentMonth,
    endYear: currentYear,
    grouping: "yearly" as "monthly" | "yearly",
    authorIds: [] as string[],
  });

  const [submitting, setSubmitting] = useState(false);

  // Select all authors when faculty list loads
  useEffect(() => {
    if (faculty && faculty.length > 0) {
      setFilters((prev) => ({
        ...prev,
        authorIds: faculty.map((f) => f.authorId),
      }));
    }
  }, [faculty]);

  // Auto-submit once when defaults + faculty loaded
  useEffect(() => {
    if (faculty && faculty.length > 0 && filters.authorIds.length > 0) {
      onSubmit(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty, filters.authorIds.length]);

  const toggleAuthor = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      authorIds: prev.authorIds.includes(id)
        ? prev.authorIds.filter((a) => a !== id)
        : [...prev.authorIds, id],
    }));
  };

  const selectAll = () => {
    if (faculty) {
      setFilters((prev) => ({
        ...prev,
        authorIds: faculty.map((f) => f.authorId),
      }));
    }
  };

  const deselectAll = () => {
    setFilters((prev) => ({
      ...prev,
      authorIds: [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    onSubmit(filters);

    setTimeout(() => setSubmitting(false), 1000); // reset after 1s (simulate)
  };

  if (isLoading) return <div>Loading faculty list...</div>;

  const startDate = new Date(filters.startYear, filters.startMonth - 1);
  const endDate = new Date(filters.endYear, filters.endMonth - 1);
  const isInvalid = startDate > endDate || filters.authorIds.length === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analytics Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Month</Label>
              <Select
                value={filters.startMonth.toString()}
                onValueChange={(val) =>
                  setFilters({ ...filters, startMonth: Number(val) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Year</Label>
              <Select
                value={filters.startYear.toString()}
                onValueChange={(val) =>
                  setFilters({ ...filters, startYear: Number(val) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {getYears().map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Month</Label>
              <Select
                value={filters.endMonth.toString()}
                onValueChange={(val) =>
                  setFilters({ ...filters, endMonth: Number(val) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Year</Label>
              <Select
                value={filters.endYear.toString()}
                onValueChange={(val) =>
                  setFilters({ ...filters, endYear: Number(val) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {getYears().map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grouping */}
          <div>
            <Label className="mb-2 block">Grouping</Label>
            <RadioGroup
              value={filters.grouping}
              onValueChange={(val) =>
                setFilters({
                  ...filters,
                  grouping: val as "monthly" | "yearly",
                })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly">Yearly</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Faculty */}
          <div>
            <Label className="mb-2 block">Select Faculty</Label>
            <div className="my-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={deselectAll}
              >
                Deselect All
              </Button>
            </div>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-2">
              {faculty?.map((f) => (
                <div key={f.authorId} className="flex items-center space-x-2">
                  <Checkbox
                    id={f.authorId}
                    checked={filters.authorIds.includes(f.authorId)}
                    onCheckedChange={() => toggleAuthor(f.authorId)}
                  />
                  <Label htmlFor={f.authorId}>{f.name}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            disabled={isInvalid || submitting}
            type="submit"
            className="w-full"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load Analytics
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
