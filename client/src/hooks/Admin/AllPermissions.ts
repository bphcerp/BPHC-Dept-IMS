import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

export interface Permission {
  permission: string;
  description: string | null;
}

export function useAllPermissions() {
  const params = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await api.get<Permission[]>(`admin/permission/all`);
      return res.data;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return params;
}
