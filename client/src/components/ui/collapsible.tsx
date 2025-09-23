import * as CollapsiblePrimitives from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

export function Collapsible({ title, children, defaultOpen = true }: { title: string | React.ReactNode; children: React.ReactNode; defaultOpen? : boolean  }) {
  return (
    <CollapsiblePrimitives.Root className="w-full" defaultOpen={defaultOpen}>
      <CollapsiblePrimitives.Trigger className="flex w-full items-center justify-between border-b pb-2 text-left text-xl font-semibold text-primary">
        {title}
        <span className="ml-2"><ChevronDown /></span>
      </CollapsiblePrimitives.Trigger>

      <CollapsiblePrimitives.Content className="overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
        <div className="mt-4">{children}</div>
      </CollapsiblePrimitives.Content>
    </CollapsiblePrimitives.Root>
  );
}