import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import documentationMap from "@/lib/documentation-map";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

const HelpButton = () => {
  const { pathname } = useLocation();

  // use the highest level matching path from the documentation map
  const currentPath = useMemo(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    let currentPath = documentationMap["/"]; // default to root if no match found

    for (let i = pathParts.length; i > 0; i--) {
      const subPath = `/${pathParts.slice(0, i).join("/")}`;
      if (Object.keys(documentationMap).includes(subPath)) {
        currentPath =
          documentationMap[subPath as keyof typeof documentationMap];
        break;
      }
    }
    return currentPath;
  }, [pathname]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {}}
          variant="outline"
          className="flex items-start gap-2 self-start"
        >
          <MessageCircleQuestion className="h-3 w-3" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[calc(100%-2rem)] min-w-[calc(100%-2rem)] flex-col">
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <embed
          src={"/documentation/" + currentPath}
          type="application/pdf"
          className="flex-1"
        />
      </DialogContent>
    </Dialog>
  );
};

export default HelpButton;
