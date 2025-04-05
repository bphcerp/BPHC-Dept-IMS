import { Check, CircleCheckBig } from "lucide-react";

interface SubmittedProps {
  courseName: string;
  courseCode: string;
  status: string;
}

function Submitted({ courseName,courseCode,status }: SubmittedProps) {
  return (
    <div className="flex justify-between items-center border-b-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <CircleCheckBig size="35" fill="green" color="white" />
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{courseName}</h1>
          <p> | </p>
          <p>{courseCode} </p>
          <p> | </p>
          <p>Submitted</p>
          <p> | </p>
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
