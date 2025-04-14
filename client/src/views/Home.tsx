import { AppSidebar, type SidebarMenuGroup } from "@/components/AppSidebar";
import TodoCard from "@/components/home/TodoCard";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/Auth";
import api from "@/lib/axios-instance";
import { LOGIN_ENDPOINT } from "@/lib/constants";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useQuery } from "@tanstack/react-query";
import { modules as allModules, todosSchemas } from "lib";
import { useCallback, useEffect, useMemo, useState } from "react";

function Home({ sidebarItems }: { sidebarItems?: SidebarMenuGroup[] }) {
  const { authState, setNewAuthToken } = useAuth();
  const [selectedModules, setSelectedModules] = useState<typeof modules>([]);
  const [filteredTodos, setFilteredTodos] = useState<
    todosSchemas.TodosResponseType["todos"]
  >([]);

  const onSuccess = useCallback(
    (credentialResponse: CredentialResponse) => {
      api
        .post<{ token: string }>(LOGIN_ENDPOINT, {
          token: credentialResponse.credential,
        })
        .then((response) => {
          console.log(response.data.token);
          setNewAuthToken(response.data.token);
        })
        .catch(() => {
          // notify login failed
        });
    },
    [setNewAuthToken]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await api.get<todosSchemas.TodosResponseType>("/todos");
      return response.data;
    },
    enabled: !!authState,
  });

  const modules = useMemo(
    () =>
      data
        ? data.todos?.reduce(
            (prev, cur) => {
              return prev.includes(cur.module) ? prev : [...prev, cur.module];
            },
            [] as (typeof allModules)[number][]
          )
        : [],
    [data]
  );

  useEffect(() => {
    if (data) {
      const filtered = data.todos.filter(
        (todo) =>
          selectedModules.length === 0 || selectedModules.includes(todo.module)
      );
      setFilteredTodos(filtered);
    }
  }, [data, selectedModules]);

  return (
    <>
      <AppSidebar items={sidebarItems ?? []} />
      <div className="relative flex min-h-screen w-full flex-col gap-6 p-8">
        {!authState ? (
          <GoogleLogin onSuccess={onSuccess} />
        ) : isError ? (
          <span className="text-destructive">An error occurred</span>
        ) : isLoading ? (
          <LoadingSpinner />
        ) : data ? (
          <>
            <h3 className="text-2xl">
              Welcome,{" "}
              <span className="font-semibold">{data.name ?? "User"}</span>
            </h3>
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-sm uppercase text-muted-foreground">
                My Roles:
              </span>
              {data.roles.map((role, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex gap-1 pt-1"
                >
                  {role}
                </Badge>
              ))}
            </div>
            {modules.length ? (
              <div className="flex flex-col items-start gap-1">
                <span className="mr-2 text-sm uppercase text-muted-foreground">
                  Filter work
                </span>
                <ToggleGroup
                  type="multiple"
                  value={selectedModules}
                  onValueChange={(selected: typeof modules) => {
                    setSelectedModules(selected);
                  }}
                  className="bg-transparent p-0"
                >
                  {modules.map((module) => (
                    <ToggleGroupItem
                      key={module}
                      value={module}
                      aria-label={`Filter by ${module}`}
                      className="border border-gray-300"
                    >
                      <span className="capitalize">{module}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ) : null}
            {filteredTodos.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(15em,1fr))] gap-4">
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="w-full max-w-sm">
                    <TodoCard
                      module={todo.module}
                      title={todo.title}
                      description={todo.description ?? ""}
                      deadline={todo.deadline ?? ""}
                      link={todo.link}
                    />
                  </div>
                ))}
              </div>
            ) : (
              "Oh so empty. Looks like there's no work to do for now."
            )}
          </>
        ) : null}
      </div>
    </>
  );
}

export default Home;
