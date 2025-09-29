import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./badge";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  className?: string;
  disabled?: boolean; // 1. Add disabled prop here
}

export function Combobox({
  options,
  selectedValues,
  onSelectedValuesChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No options found.",
  className,
  disabled = false, // 2. Destructure the prop with a default value
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (currentValue: string) => {
    const newSelectedValues = selectedValues.includes(currentValue)
      ? selectedValues.filter((value) => value !== currentValue)
      : [...selectedValues, currentValue];
    onSelectedValuesChange(newSelectedValues);
  };

  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-[2.5rem] w-full justify-between",
            className
          )}
          disabled={disabled} // 3. Pass the disabled prop to the Button
        >
          <div className="flex flex-wrap gap-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="mr-1">
                  {label}
                </Badge>
              ))
            ) : (
              <span className="font-normal text-muted-foreground">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
