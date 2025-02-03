import type React from "react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { UserCircle2 } from "lucide-react";
import { Button } from "../ui/button";

interface UserData {
  email: string;
  type: string;
  name: string | null;
  [key: string]: string[] | number | boolean | string | null | undefined;
}

interface UserDetailsProps {
  data: UserData;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ data }) => {
  const renderValue = (value?: string[] | number | boolean | string | null) => {
    if (value === undefined || value === null) return "-";
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return value === true ? "Yes" : "No";
    }

    return String(value);
  };

  const handleDeactivate = () => {
    console.log("User has been deactivated");
  };

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <UserCircle2 className="h-16 w-16 text-gray-400" />
          <div>
            <h2 className="text-xl font-semibold">
              {data.name ?? "Invite pending"}
            </h2>
            <p className="text-sm text-gray-500">
              {data.type?.toUpperCase() || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(data).map(
            ([key, value]) =>
              key !== "name" &&
              key !== "type" && (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium capitalize text-gray-500">
                    {key.replace(/_/g, " ").toUpperCase()}
                  </p>
                  <div className="text-sm">{renderValue(value)}</div>
                </div>
              )
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          onClick={handleDeactivate}
          className="text-white"
        >
          Deactivate User
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserDetails;
