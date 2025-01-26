import { useState } from "react";
import api from "@/lib/axios-instance";
import { ADD_MEMBER_ENDPOINT } from "@/lib/constants"; 
// creates types for member data and its response
interface AddMemberData {
  email: string;
  role: string;
}

interface UseAddMemberResponse {
  addMember: (data: AddMemberData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// created useAddMember api which can be directly used on frontend to add the members
const useAddMember = (): UseAddMemberResponse => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = async (data: AddMemberData) => {
    setIsLoading(true);
    setError(null); 

    try {
      // Use the endpoint from constants
      await api.post(ADD_MEMBER_ENDPOINT, data);
    } catch (err: any) {
      setError("Failed to add the member. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addMember,
    isLoading,
    error,
  };
};

export default useAddMember;
