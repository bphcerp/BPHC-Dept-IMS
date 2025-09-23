import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Control, Controller } from "react-hook-form";

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

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  control: Control<any>;
  name: string;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  control,
  name,
  options,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No options found.",
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={[]}
      render={({ field }) => (
        <div className="w-full">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-auto w-full justify-between"
              >
                <div className="flex flex-wrap gap-1">
                  {field.value.length > 0
                    ? field.value.map((value: string) => (
                        <Badge
                          variant="secondary"
                          key={value}
                          className="mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValue = field.value.filter(
                              (v: string) => v !== value
                            );
                            field.onChange(newValue);
                          }}
                        >
                          {options.find((o) => o.value === value)?.label}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))
                    : placeholder}
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
                        onSelect={() => {
                          const currentValues = field.value || [];
                          const isSelected = currentValues.includes(
                            option.value
                          );
                          if (isSelected) {
                            field.onChange(
                              currentValues.filter(
                                (v: string) => v !== option.value
                              )
                            );
                          } else {
                            field.onChange([...currentValues, option.value]);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value?.includes(option.value)
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
        </div>
      )}
    />
  );
};
