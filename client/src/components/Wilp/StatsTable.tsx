interface FacultyStat {
  faculty: { name: string; email: string };
  selected: number;
  required: number;
}

interface StatsTableProps {
  facultyList: FacultyStat[];
}

export default function StatsTable({ facultyList }: StatsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Faculty Name</th>
            <th className="px-4 py-2 text-left font-semibold">Faculty Email</th>
            <th className="px-4 py-2 text-left font-semibold">Projects Selected</th>
            <th className="px-4 py-2 text-left font-semibold">Min. Projects Left</th>
          </tr>
        </thead>
        <tbody>
          {facultyList.map((f, idx) => (
            <tr key={f.faculty.email || idx} className="border-t">
              <td className="px-4 py-2">{f.faculty.name}</td>
              <td className="px-4 py-2">{f.faculty.email}</td>
              <td className="px-4 py-2">{f.selected}</td>
              <td className="px-4 py-2">{f.required}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
