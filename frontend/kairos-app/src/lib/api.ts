/**
 * API Client
 *
 * HTTP client for Frappe REST API communication
 */

const BASE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8000";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiError {
  message: string;
  exc_type?: string;
  exc?: string;
}

/**
 * Make an API request to Frappe backend
 */
export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // Include cookies for session auth
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

/**
 * Get a single document
 */
export async function getDoc<T>(doctype: string, name: string): Promise<T> {
  const response = await api<{ data: T }>(`/api/resource/${doctype}/${name}`);
  return response.data;
}

/**
 * Get a list of documents
 */
export async function getList<T>(
  doctype: string,
  options: {
    fields?: string[];
    filters?: Record<string, unknown>;
    limit?: number;
    start?: number;
    orderBy?: string;
  } = {}
): Promise<T[]> {
  const params = new URLSearchParams();

  if (options.fields) {
    params.set("fields", JSON.stringify(options.fields));
  }
  if (options.filters) {
    params.set("filters", JSON.stringify(options.filters));
  }
  if (options.limit) {
    params.set("limit_page_length", String(options.limit));
  }
  if (options.start) {
    params.set("limit_start", String(options.start));
  }
  if (options.orderBy) {
    params.set("order_by", options.orderBy);
  }

  const response = await api<{ data: T[] }>(
    `/api/resource/${doctype}?${params.toString()}`
  );
  return response.data;
}

/**
 * Create a new document
 */
export async function createDoc<T>(
  doctype: string,
  data: Partial<T>
): Promise<T> {
  const response = await api<{ data: T }>(`/api/resource/${doctype}`, {
    method: "POST",
    body: data,
  });
  return response.data;
}

/**
 * Update a document
 */
export async function updateDoc<T>(
  doctype: string,
  name: string,
  data: Partial<T>
): Promise<T> {
  const response = await api<{ data: T }>(`/api/resource/${doctype}/${name}`, {
    method: "PUT",
    body: data,
  });
  return response.data;
}

/**
 * Delete a document
 */
export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await api(`/api/resource/${doctype}/${name}`, {
    method: "DELETE",
  });
}

/**
 * Call a whitelisted Frappe method
 */
export async function call<T>(
  method: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const response = await api<{ message: T }>(`/api/method/${method}`, {
    method: "POST",
    body: args,
  });
  return response.message;
}
