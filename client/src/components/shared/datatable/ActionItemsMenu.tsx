import * as React from "react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, LucideIcon } from "lucide-react";

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface ActionItemsMenuProps {
  items: ActionItem[];
}

export const ActionItemsMenu: React.FC<ActionItemsMenuProps> = ({ items }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={idx} onClick={item.onClick}>
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};