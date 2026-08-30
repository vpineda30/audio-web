export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
export const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ??"http://localhost:8080";

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
};

export async function request<T>(
    endpoint: string,
    { method = "GET", body }: RequestOptions = {}
): Promise<T> {
    const headers: HeadersInit = {};

    const isFormData = body instanceof FormData;

    if (body !== undefined && !isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = data?.error ?? data?.message ?? "Erro na requisição";

        if (response.status === 401 && typeof window !== "undefined") {
            window.localStorage.removeItem("userId");
            if (!window.location.pathname.startsWith("/login")) {
                window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
        }

        throw new Error(message);
    }

    return data as T;
}