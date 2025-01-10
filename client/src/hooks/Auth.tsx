import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN_KEY, REFRESH_ENDPOINT } from "@/lib/constants";
import api from "@/lib/axios-instance";
import { useQueryClient } from "@tanstack/react-query";

export interface Operations {
  allowed: string[];
  disallowed: string[];
}

interface AuthState {
  email: string;
  operations: Operations;
  sessionExpiry: number;
  exp: number;
}

interface AuthContextType {
  authState: AuthState | null;
  updateAuthState: (accessToken?: string | null) => void;
  refreshAuthState: () => void;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseJwt = (token: string) => {
  try {
    const decoded = jwtDecode<AuthState>(token);
    const curTime = Date.now() / 1000;
    if (!decoded.sessionExpiry || decoded.exp < curTime) {
      api
        .post<{ token: string }>(REFRESH_ENDPOINT)
        .then((resp) => localStorage.setItem(ACCESS_TOKEN_KEY, resp.data.token))
        .catch(() => localStorage.removeItem(ACCESS_TOKEN_KEY)); // TODO: find out a way to refresh auth state after calling refresh endpoint
    }
    return decoded;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState | null>(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return null;
    return parseJwt(accessToken);
  });

  const updateAuthState = useCallback(
    (accessToken?: string | null) => {
      if (!accessToken) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setAuthState(null);
      } else {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        setAuthState(parseJwt(accessToken));
      }
    },
    [setAuthState]
  );

  const refreshAuthState = useCallback(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return null;
    setAuthState(parseJwt(accessToken));
  }, [setAuthState]);

  const logOut = useCallback(() => {
    api
      .post("/auth/logout")
      .catch(() => {})
      .finally(() => {
        updateAuthState(null);
        queryClient.clear();
      });
  }, [updateAuthState, queryClient]);

  const value: AuthContextType = {
    authState,
    updateAuthState,
    refreshAuthState,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
