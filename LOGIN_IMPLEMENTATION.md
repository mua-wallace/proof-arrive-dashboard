# Login implementation (copy/paste template)

This repo’s login/auth pattern is implemented with React + TypeScript + React Router + Axios + React Query + Zustand.
Use this doc as a copy/paste starter to implement the same flow in another project.

---

## What this implementation does

- Login page calls `POST /auth/login`
- Stores tokens in `localStorage`: `accessToken`, `refreshToken`
- Axios client auto-attaches `Authorization: Bearer <accessToken>`
- On `401`, client calls `POST /auth/refresh-token`, stores new `accessToken`, retries the original request once
- If refresh fails, clears tokens and redirects to `/login`
- Route guard blocks protected routes unless `isAuthenticated === true`

---

## Backend endpoints expected

### `POST /auth/login`

Request:

```json
{ "username": "string", "password": "string" }
```

Response:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": { "accid": "string", "subid": "string", "username": "string" }
}
```

### `POST /auth/refresh-token`

Request:

```json
{ "refreshToken": "string" }
```

Response:

```json
{ "accessToken": "string" }
```

---

## Files to copy into your project

### `src/api/client.ts`

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

function getApiBaseUrl(): string {
  let url = import.meta.env.VITE_API_BASE_URL || "https://example.com/api/v1";
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && url.startsWith("http://")) {
    url = url.replace(/^http:\/\//, "https://");
  }
  return url;
}

const API_BASE_URL = getApiBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Missing refresh token");

        const resp = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken } = resp.data as { accessToken: string };

        localStorage.setItem("accessToken", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### `src/api/auth.ts`

```ts
import { apiClient } from "./client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  accid: string;
  subid: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>("/auth/refresh-token", { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};
```

### `src/stores/auth.store.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../api/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: "auth-storage" }
  )
);
```

### `src/routes/ProtectedRoute.tsx`

```tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

### `src/pages/Login.tsx` (minimal UI)

```tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate("/app");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? err?.message ?? "Login failed";
      if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
        setError("Cannot reach the server. Check API HTTPS + CORS.");
      } else {
        setError(message);
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Login</h1>

      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={loginMutation.isPending} />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </label>
        </div>

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
```

---

## Router setup example (React Router v6)

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import AppShell from "./AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Notes / gotchas

- If you serve the frontend over HTTPS, your API must be HTTPS too (mixed content is blocked).
- `localStorage` is simple but not the most secure option; for higher security, use HttpOnly cookies + CSRF protection.
- Refresh flow retries only once (via `_retry`) to prevent infinite loops.

