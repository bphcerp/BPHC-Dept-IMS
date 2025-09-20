import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { AssignRoleComboBox } from "./AssignRoleDialog";
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export async function handleStart(roles: string[], callback: () => void) {
  if (!roles.length) {
    toast.error("Please select atleast 1 role");
    return;
  }

  try {
    await api.post("/admin/testing/start", {
      testerRoles: roles,
    });
    toast.success(`Testing mode started with roles: ${roles.join(", ")}`);
    callback();
  } catch (err) {
    console.error("Start testing error: ", err);
    let errorMessage = "Failed to start testing mode";
    if (err && typeof err === "object") {
      const apiErr = err as ApiError & { message?: string; status?: number };
      console.log("API Error: ", apiErr);
      if (apiErr.response?.data?.message) {
        errorMessage = apiErr.response.data.message;
      } else if (apiErr.message) {
        errorMessage = apiErr.message;
      } else if (apiErr.status) {
        errorMessage += ` (Status: ${apiErr.status})`;
      }
    }
    toast.error(errorMessage);
  }
}

export async function handleEdit(roles: string[], callback: () => void) {
  if (!roles.length) {
    toast.error("Please select atleast 1 role");
    return;
  }

  try {
    await api.post("/admin/testing/edit", {
      testerRoles: roles,
    });
    toast.success(`Roles updated: ${roles.join(", ")}`);
    callback();
  } catch (err) {
    console.error("Edit roles error: ", err);
    let errorMessage = "Failed to edit testing roles";
    if (err && typeof err === "object") {
      const apiErr = err as ApiError & { message?: string; status?: number };
      console.log("API Error: ", apiErr);
      if (apiErr.response?.data?.message) {
        errorMessage = apiErr.response.data.message;
      } else if (apiErr.message) {
        errorMessage = apiErr.message;
      } else if (apiErr.status) {
        errorMessage += ` (Status: ${apiErr.status})`;
      }
    }
    toast.error(errorMessage);
  }
}

export async function handleEnd(callback: () => void) {
  try {
    await api.post("/admin/testing/end");
    toast.success(`Testing mode ended successfully`);
    callback();
  } catch (err) {
    console.error("End testing error: ", err);
    let errorMessage = "Failed to end testing mode";
    if (err && typeof err === "object") {
      const apiErr = err as ApiError & { message?: string; status?: number };
      console.log("API Error: ", apiErr);
      if (apiErr.response?.data?.message) {
        errorMessage = apiErr.response.data.message;
      } else if (apiErr.message) {
        errorMessage = apiErr.message;
      } else if (apiErr.status) {
        errorMessage += ` (Status: ${apiErr.status})`;
      }
    }
    toast.error(errorMessage);
  }
}

function TestingPopup() {
  const [roles, setRoles] = useState<string[]>([]);
  const [inTestingMode, setInTestingMode] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    updateStatus();
  }, []);

  async function updateStatus() {
    await api
      .get("/admin/testing/status")
      .then((res) => {
        setInTestingMode(res.data.inTestingMode);
        setRoles(res.data.roles ?? []);
      })
      .catch(() => {
        console.log("Failed to load testing status");
      });
  }
  return (
    <>
      {inTestingMode ? (
        <div className="absolute bottom-0 right-0 z-20 flex flex-col items-end gap-4 p-6">
          {isOpen && (
            <div className="mx-auto flex h-[18rem] w-[26rem] max-w-6xl flex-1 flex-col gap-2 rounded-lg border-[1px] bg-white p-4">
              <div className="flex flex-row items-center justify-between">
                <h1 className="text-xl font-bold text-primary">
                  Testing Ongoing
                </h1>
                <div
                  className="h-min cursor-pointer rounded-full p-2 hover:bg-accent/50"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="s-4" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Card className="relative h-36 overflow-scroll rounded-none border-0 shadow-none">
                  <CardContent className="flex flex-wrap gap-2 px-0 py-2">
                    {roles.map((role, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="flex gap-1 pt-1 text-sm"
                      >
                        {role}
                        <button
                          className="p-1 pr-0"
                          onClick={() => {
                            setRoles(roles.filter((r) => r !== role));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}

                    <AssignRoleComboBox
                      existing={roles}
                      callback={(role) => {
                        setRoles([...roles, role]);
                      }}
                    >
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </AssignRoleComboBox>
                  </CardContent>
                </Card>
                <div className="flex flex-row gap-4">
                  <Button
                    type="submit"
                    className="w-max"
                    onClick={() => handleEdit(roles, updateStatus)}
                  >
                    Update Roles
                  </Button>
                  <Button
                    type="submit"
                    variant={"outline"}
                    className="w-max"
                    onClick={() => handleEnd(updateStatus)}
                  >
                    End Testing
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div>
            <Button
              className="text-base font-bold"
              onClick={() => setIsOpen(!isOpen)}
            >
              Edit Testing Scope
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TestingPopup;
