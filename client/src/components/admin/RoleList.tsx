import { Link } from "react-router-dom";
import { Edit, Trash } from "lucide-react";

export interface Role {
  role: string;
  memberCount: number;
}

export default function RoleList({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-col gap-2">
      {roles.map(({ role, memberCount }) => (
        <div key={role} className="grid grid-cols-3 gap-4 border-b pb-2">
          <p className="text-lg font-bold">{role}</p>
          <p className="mx-auto text-lg text-muted-foreground">
            {memberCount} {memberCount !== 1 ? "members" : "member"}
          </p>
          <div className="ml-auto flex gap-1">
            <Link
              to={`${role}`}
              className="rounded-md p-1 hover:bg-muted/50 data-[state=on]:bg-destructive data-[state=on]:text-white"
            >
              <Edit className="h-5 w-5" />
            </Link>
            <button
              onClick={() => {}}
              className="rounded-md p-1 hover:bg-muted/50 data-[state=on]:bg-muted/70 data-[state=on]:text-muted-foreground"
            >
              <Trash className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
