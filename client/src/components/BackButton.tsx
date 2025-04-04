import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackButton = () => {
  return (
    <Button
      onClick={() => {
        window.history.back();
      }}
      variant="outline"
      className="flex items-start gap-2 self-start"
    >
      <ArrowLeft className="h-3 w-3" />
      Back
    </Button>
  );
};

export default BackButton;
