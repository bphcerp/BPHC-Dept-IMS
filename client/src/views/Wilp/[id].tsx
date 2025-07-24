import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";

// Define a type for the project for better type safety
interface Project {
  studentId?: string;
  studentName?: string;
  discipline?: string;
  organization?: string;
  degreeProgram?: string;
  researchArea?: string;
  dissertationTitle?: string;
  facultyEmail?: string;
  // Add more fields as needed
}

export default function WilpProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/wilpProject/view?id=${id}`)
      .then(res => setProject(res.data as Project))
      .catch(() => setError("Failed to load project details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;
  if (!project) return <div className="flex-1 flex items-center justify-center">Project not found</div>;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Back</Button>
        <h1 className="text-3xl font-bold mb-4">WILP Project Details</h1>
        <div className="bg-white rounded shadow p-6 space-y-3">
          <Detail label="Student ID" value={project.studentId} />
          <Detail label="Student Name" value={project.studentName} />
          <Detail label="Discipline" value={project.discipline} />
          <Detail label="Organization" value={project.organization} />
          <Detail label="Degree Program" value={project.degreeProgram} />
          <Detail label="Research Area" value={project.researchArea} />
          <Detail label="Dissertation Title" value={project.dissertationTitle} />
          {project.facultyEmail && <Detail label="Faculty Email" value={project.facultyEmail} />}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900">{value ?? "-"}</span>
    </div>
  );
}