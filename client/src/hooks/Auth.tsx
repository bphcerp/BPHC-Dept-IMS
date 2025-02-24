import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN_KEY, REFRESH_ENDPOINT } from "@/lib/constants";
import api from "@/lib/axios-instance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authUtils, type authTypes } from "lib";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const [tokenValue, setTokenStateValue] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const setTokenValue = useCallback(
    (token: string | null) => {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      setTokenStateValue(token);
    },
    [setTokenStateValue]
  );

  const parseJwt = useCallback(
    (token: string | null) => {
      if (!token) return null;
      try {
        const decoded = jwtDecode<AuthState>(token);
        const curTime = Date.now() / 1000;
        if (decoded.exp < curTime) {
          if (decoded.sessionExpiry < curTime - 2000) return null;
          if (!api.isRefreshing) {
            api.isRefreshing = true;
            api
              .post<{ token: string }>(REFRESH_ENDPOINT)
              .then((resp) => setTokenValue(resp.data.token))
              .catch(() => setTokenValue(null))
              .finally(() => (api.isRefreshing = false));
          }
        }
        return decoded;
      } catch {
        return null;
      }
    },
    [setTokenValue]
  );

  const [authState, setAuthState] = useState<AuthState | null>(() =>
    parseJwt(tokenValue)
  );

  useEffect(() => {
    setAuthState(parseJwt(tokenValue));
  }, [tokenValue, parseJwt]);

  const logOutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      setTokenValue(null);
      queryClient.clear();
    },
  });

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
        setNewAuthToken: setTokenValue,
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
