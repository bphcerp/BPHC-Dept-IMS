import { useIsMobile } from "@/hooks/use-mobile";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import type { Role } from "@/components/admin/RoleList";
import { LoadingSpinner } from "../ui/spinner";

export function AssignRoleComboBox({
  children,
  existing,
  callback,
}: {
  children: React.ReactNode;
  existing: string[];
  callback: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const commandComponent = (
    <StatusList
      existing={existing}
      callback={(role) => {
        callback(role);
        setOpen(false);
      }}
    />
  );

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          {commandComponent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">{commandComponent}</div>
      </DrawerContent>
    </Drawer>
  );
}

function StatusList({
  callback,
  existing,
}: {
  callback: (role: string) => void;
  existing: string[];
}) {
  const { data: roles, isFetching } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.get<Role[]>("/admin/role/all");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>
          {isFetching ? (
            <LoadingSpinner className="mx-auto" />
          ) : (
            "No results found."
          )}
        </CommandEmpty>
        <CommandGroup>
          {roles &&
            roles
              .filter(({ roleName }) => !existing.includes(roleName))
              .map(({ roleName: role }) => (
                <CommandItem key={role} value={role} onSelect={callback}>
                  {role}
                </CommandItem>
              ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
