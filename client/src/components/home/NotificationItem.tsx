import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export const NotificationItem = ({
  module,
  title,
  content,
  createdAt,
  read,
}: {
  module: string;
  title: string;
  content?: string | null;
  createdAt: string;
  read: boolean;
}) => {
  return (
    <Card className="relative p-2">
      {!read ? (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary" />
      ) : null}
      <CardHeader className="flex flex-col p-0">
        <h4 className="text-sm text-muted-foreground">{module}</h4>
        {title}
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-sm text-muted-foreground">
          {content ?? "No content available"}
        </p>
      </CardContent>
      <CardFooter className="justify-end p-0 text-sm text-muted-foreground">
        {createdAt}
      </CardFooter>
    </Card>
  );
};
