import { useState } from "react";
import DcaRequest from "@/components/qp_review/DcaRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

function DcaRequestList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("ongoing");
  const [open, setOpen] = useState(false);
  const [ficDeadline, setFicDeadline] = useState<Date | undefined>();
  const [srDeadline, setSrDeadline] = useState<Date | undefined>();

  const dcaRequests = [
    { courseName: "ECE F342 MID SEM", professor: "Prof. Harish V Dixit", reviewer1: "atiksh", reviewer2: "shreyansh", status: "Ongoing" },
    { courseName: "ME F342 MID SEM", professor: "Prof. Supradeepan", reviewer1: "adeeb", reviewer2: "shiv", status: "Approved" },
    { courseName: "CS F213 DATA STRUCTURES", professor: "Prof. S.Panda", reviewer1: "soumitra", reviewer2: "tanay", status: "Pending" },
  ];

  const filteredRequests = dcaRequests.filter((req) => req.status.toLowerCase() === sort);

  return (
    <div className="container flex flex-col gap-4 px-10 pt-4">
      <h1 className="text-3xl font-bold text-primary">DCA Requests</h1>

      {/* Search & Filter Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
            <Input type="search" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-9" />
          </div>
          <Button>Search</Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="gap-2 flex justify-between items-center border-2 px-4 py-2">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>

          {/* Create New Request Button (Kept Exactly as It Was) */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border px-4 py-2">
                <PlusCircle className="w-5 h-5" />
                Create New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create/Edit New Request</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                {/* Course Name */}
                <div>
                  <label className="font-semibold">Course Name</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECE F342">ECE F342</SelectItem>
                      <SelectItem value="ME F342">ME F342</SelectItem>
                      <SelectItem value="CS F213">CS F213</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Course Code */}
                <div>
                  <label className="font-semibold">Course Code</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F342">F342</SelectItem>
                      <SelectItem value="F213">F213</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* FIC */}
                <div>
                  <label className="font-semibold">FIC</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select FIC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prof. Dixit">Prof. Dixit</SelectItem>
                      <SelectItem value="Prof. Supradeepan">Prof. Supradeepan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadlines */}
                <div className="grid grid-cols-2 gap-4">
                  {/* FIC Deadline */}
                  <div>
                    <label className="font-semibold">FIC Deadline</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full flex justify-between">
                          {ficDeadline ? ficDeadline.toLocaleDateString("en-US") : "Select Date"}
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start">
                        <Calendar mode="single" selected={ficDeadline} onSelect={setFicDeadline} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* SR Deadline */}
                  <div>
                    <label className="font-semibold">SR Deadline</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full flex justify-between">
                          {srDeadline ? srDeadline.toLocaleDateString("en-US") : "Select Date"}
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start">
                        <Calendar mode="single" selected={srDeadline} onSelect={setSrDeadline} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DCA Requests */}
      <div className="flex flex-col gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req, index) => (
            <DcaRequest key={index} courseName={req.courseName} professor={req.professor} reviewer1={req.reviewer1} reviewer2={req.reviewer2} status={req.status as "Ongoing" | "Pending" | "Approved"} />
          ))
        ) : (
          <p className="text-gray-500">No requests found for {sort}.</p>
        )}
      </div>
    </div>
  );
}

export default DcaRequestList;
