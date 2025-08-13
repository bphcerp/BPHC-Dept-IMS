// TODO: Fetch data from the server, remove hardcoded values, and implement the logic for the buttons
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";

export const AllocationOverview = () => {

  return (
    <div className="courseAllocationOverviewRootContainer p-4 flex flex-col space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Course Load Allocation Overview</h1>
        <div className="flex space-x-2">
          {<Button><a href="ongoing/new">New Semester</a></Button> /* TODO: check if an allocation is already in progress, this button should not show if thats the case */}
          <Button variant='secondary'>Send Reminder</Button> { /* TODO: check if there are pending responses, this button should not show if all responses have been received or the allocation deadline has been reached*/}
        </div>
      </header>
      {/* TODO: check for allocation in progress here */}
      {true ? <><section className="allocationStatsPanel">
        <h2 className="text-xl font-semibold mb-2 text-primary">Stats</h2>
        <div className="grid grid-cols-3 gap-8 h-36">
          <div className="border border-primary rounded-xl flex flex-col justify-center items-center space-y-2">
            <span>Time Remaining</span>
            <span className="text-4xl font-extrabold">02:15:00</span>
          </div>
          <div className="border border-primary rounded-xl flex flex-col justify-center items-center space-y-2">
            <span>Responses</span>
            <span className="text-4xl font-extrabold text-green-600">12</span>
          </div>
          <div className="border border-primary rounded-xl flex flex-col justify-center items-center space-y-2">
            <span>Pending</span>
            <span className="text-4xl font-extrabold text-red-600">5</span>
          </div>
        </div>
      </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-primary">Current Semester Details</h2>
          <h2 className="text-sm mb-2 text-primary italic">At the time of the allocation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-base font-medium text-muted-foreground">
            <div>
              <span>Semester:</span> <span>1</span>
            </div>
            <div>
              <span>Academic Year:</span> <span>2025-2026</span>
            </div>
            <div>
              <span>Allocation Started On:</span> <span>10 Aug 2025</span>
            </div>
            <div>
              <span>Ending On:</span> <span>20 Aug 2025</span>
            </div>
            <div>
              <span>No. of Courses (FD):</span> <span>8</span> { /* should be a link whih would show another page with info about all the courses */}
            </div>
            <div>
              <span>No. of Courses (HD):</span> <span>6</span>
            </div>
            <div className="col-span-2 md:col-span-3">
              <span>HoD:</span> <span>Prof. G. H. Head</span>
            </div>
            <div className="col-span-2 md:col-span-3">
              <span>DCA Convener:</span> <span>Dr. A. B. Example</span>
            </div>
            <div className="col-span-2 md:col-span-3">
              <span>DCA Committee:</span> <span>{["Dr. A. B. Example", "Prof. C. D. Test", "Dr. E. F. Sample"].join(", ")}</span>
            </div>
          </div>
        </section></> :
        <div className="text-2xl flex justify-center space-x-2 text-secondary"><AlertCircleIcon /> <span>No allocation in progress</span></div>
      }
    </div>
  );
}