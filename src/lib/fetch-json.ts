/** Parse a fetch Response as JSON; avoids "Unexpected end of JSON input" on empty bodies. */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`Empty response (${res.status}) from ${res.url || "API"}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON (${res.status}) from ${res.url || "API"}`);
  }
}
