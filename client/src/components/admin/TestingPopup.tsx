import api from "@/lib/axios-instance";
import { toast } from "sonner";

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
  return <div>TestingPopup</div>;
}

export default TestingPopup;
