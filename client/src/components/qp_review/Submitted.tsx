import { Check, CircleCheckBig } from "lucide-react";

interface SubmittedProps {
  course: string;
  status: string;
}

function Submitted({ course, status }: SubmittedProps) {
  return (
    <div className="flex items-center justify-between border-b-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <CircleCheckBig size="35" fill="green" color="white" />
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{course}</h1>
          <p>|</p>
          <p>Submitted</p>
          <p>|</p>
          <p>Status: {status}</p>
        </div>
      </div>
      <div>
        <Check size="20" />
      </div>
    </div>
  );
}

export default Submitted;
