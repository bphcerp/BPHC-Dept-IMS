import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN_KEY } from "@/lib/constants";
import api from "@/lib/axios-instance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authUtils, type authTypes } from "lib";
import { useLocalStorage } from "usehooks-ts";

interface AuthState extends authTypes.JwtPayload {
  exp: number;
}

interface AuthContextType {
  authState: AuthState | null;
  setNewAuthToken: (accessToken: string) => void;
  logOut: () => void;
  checkAccess: (permission: string) => boolean;
  checkAccessAnyOne: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseJwt = (token: string) => {
  try {
    const decoded = jwtDecode<AuthState>(token);
    return decoded;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [value, setValue, removeValue] = useLocalStorage(ACCESS_TOKEN_KEY, "");
  const [authState, setAuthState] = useState<AuthState | null>(() =>
    parseJwt(value)
  );

  useEffect(() => {
    setAuthState(parseJwt(value));
  }, [value]);

  const logOutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      removeValue();
      queryClient.clear();
    },
  });

  const setNewAuthToken = (value: string) => {
    setValue(value);
  };

  const logOut = logOutMutation.mutate;

  const checkAccess = useCallback(
    (requiredPermission: string) => {
      if (!authState) return false;
      const hasPermissions = authState.permissions;
      return authUtils.checkAccess(requiredPermission, hasPermissions);
    },
    [authState]
  );

  const checkAccessAnyOne = useCallback(
    (requiredPermissions: string[]) => {
      if (!authState) return false;
      const hasPermissions = authState.permissions;
      return requiredPermissions.some((permission) =>
        authUtils.checkAccess(permission, hasPermissions)
      );
    },
    [authState]
  );

  return (
    <AuthContext.Provider
      value={{
        setNewAuthToken,
        authState,
        logOut,
        checkAccess,
        checkAccessAnyOne,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
