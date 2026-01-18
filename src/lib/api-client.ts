import { goto } from "@mateothegreat/svelte5-router";
import { authClient } from "$lib/auth-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function getAuthToken(): Promise<string | null> {
  try {
    const token = await authClient.token().then((x) => x.data?.token);
    return token || null;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    console.log("401 Unauthorized - redirecting to login");
    goto("/login");
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Check for 401 before returning
  if (response.status === 401) {
    console.log("401 Unauthorized - redirecting to login");
    goto("/login");
  }

  return response;
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await apiFetch(url);
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body: any): Promise<T> {
    const response = await apiFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body: any): Promise<T> {
    const response = await apiFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string): Promise<T> {
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    return handleResponse<T>(response);
  },
};
