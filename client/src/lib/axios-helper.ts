import axios from "axios";
import {
  ACCESS_TOKEN_KEY,
  BASE_API_URL,
  REFRESH_ENDPOINT,
} from "@/lib/constants";

export async function forceRefreshToken() {
  try {
    const response = await axios.post<{ token: string }>(
      BASE_API_URL + REFRESH_ENDPOINT,
      undefined,
      { withCredentials: true }
    );
    const accessToken = response.data.token;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
}
