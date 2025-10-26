import * as CollapsiblePrimitives from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
  defaultOpen?: boolean;
  open?: boolean; 
  onOpenChange?: (isOpen: boolean) => void; 
  forceMount?: boolean; 
}

export function Collapsible({
  title,
  children,
  titleClassName = "",
  bodyClassName = "",
  defaultOpen = true,
  open, 
  onOpenChange, 
  forceMount,
}: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  const isActuallyOpen = open !== undefined ? open : internalIsOpen;

  return (
    <CollapsiblePrimitives.Root
      className="w-full"
      open={isActuallyOpen} // <-- PASS the 'open' prop
      defaultOpen={defaultOpen}
      onOpenChange={(op) => {
        setInternalIsOpen(op); // Update internal state for chevron
        if (onOpenChange) onOpenChange(op); // Notify parent
      }}
    >
      <CollapsiblePrimitives.Trigger
        className={`flex w-full items-center justify-between border-b pb-2 text-left text-xl font-semibold text-primary ${titleClassName}`}
      >
        {title}
        {/* Use the *actual* state for the icon */}
        <span className="ml-2">
          {isActuallyOpen ? <ChevronUp /> : <ChevronDown />}
        </span>
      </CollapsiblePrimitives.Trigger>

      <CollapsiblePrimitives.Content
        className={`overflow-hidden data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up ${bodyClassName}`}
        forceMount={forceMount ? true : undefined}  
      >
        <div className="mt-4 data-[state=closed]:h-0">{children}</div>
      </CollapsiblePrimitives.Content>
    </CollapsiblePrimitives.Root>
  );
}