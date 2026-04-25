import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const normalizeToken = (value: string | undefined) => {
  if (!value) return undefined;
  if (value === "undefined" || value === "null") return undefined;
  return value;
};

const cookieOptions = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const authTokenStorage = {
  getAccessToken: () => normalizeToken(Cookies.get(ACCESS_TOKEN_KEY)),
  getRefreshToken: () => normalizeToken(Cookies.get(REFRESH_TOKEN_KEY)),
  setTokens: (tokens: { access_token: string; refresh_token: string }) => {
    Cookies.set(ACCESS_TOKEN_KEY, tokens.access_token, cookieOptions);
    Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh_token, cookieOptions);
  },
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};
