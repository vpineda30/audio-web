const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
        throw new Error(data?.error ?? data?.message ?? "Erro na requisição");
    }

    return data as T;
}