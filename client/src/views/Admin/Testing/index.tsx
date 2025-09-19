import { AssignRoleComboBox } from "@/components/admin/AssignRoleDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios-instance";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const TestingView = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [inTestingMode, setInTestingMode] = useState<boolean | null>(null);

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
        toast.error("Failed to load testing status");
      });
  }

  async function handleStart() {
    if (!roles.length) {
      toast.error("Please select atleast 1 role");
      return;
    }

    try {
      await api.post("/admin/testing/start", {
        testerRoles: roles,
      });
      toast.success(`Testing mode started with roles: ${roles.join(", ")}`);
      updateStatus();
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

  async function handleEdit() {
    if (!roles.length) {
      toast.error("Please select atleast 1 role");
      return;
    }

    try {
      await api.post("/admin/testing/edit", {
        testerRoles: roles,
      });
      toast.success(`Roles updated: ${roles.join(", ")}`);
      updateStatus();
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

  async function handleEnd() {
    try {
      await api.post("/admin/testing/end");
      toast.success(`Testing mode ended successfully`);
      updateStatus();
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

  return (
    <>
      {inTestingMode === null ? (
        <div className="flex flex-1 items-center justify-center">
          Loading...
        </div>
      ) : (
        <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-8 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Testing Module</h1>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 px-2 text-xl">
              {inTestingMode ? "Modify testing roles" : "Add testing roles"}
            </div>

            <Card className="relative h-36 overflow-scroll transition-shadow duration-200 hover:shadow-md">
              <CardContent className="flex flex-wrap gap-2 p-4">
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
                onClick={inTestingMode ? handleEdit : handleStart}
              >
                {inTestingMode ? "Update Roles" : "Start Testing Mode"}
              </Button>
              {inTestingMode && (
                <Button
                  type="submit"
                  variant={"outline"}
                  className="w-max"
                  onClick={handleEnd}
                >
                  End Testing
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestingView;
