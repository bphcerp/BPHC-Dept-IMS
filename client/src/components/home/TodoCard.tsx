import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { buttonVariants } from "../ui/button";

interface TodoCardProps {
  module: string;
  title: string;
  description: string;
  deadline: string;
  link: string | null;
}

const TodoCard: React.FC<TodoCardProps> = ({
  module,
  title,
  description,
  deadline,
  link,
}) => {
  const formattedDeadline = deadline?.length
    ? new Date(deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <Card className="flex h-full w-full max-w-md flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{module}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-gray-700">{description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 pb-4 pr-4">
        {formattedDeadline && (
          <span className="text-sm text-destructive">
            Deadline: {formattedDeadline}
          </span>
        )}
        {link && (
          <Link to={link} className={buttonVariants({ className: "self-end" })}>
            Go to Task
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default TodoCard;
