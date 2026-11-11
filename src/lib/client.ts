import type { Resource } from "./models";
export async function api<T = unknown>(data: unknown): Promise<T> {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(body.error || "Could not save."), {
      status: response.status,
    });
  return body.result as T;
}
export const save = <T>(resource: Resource, data: T) =>
  api<T>({ action: "save", resource, data });
export function base(artistId: string) {
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    artist_id: artistId,
    created_at: at,
    updated_at: at,
  };
}
export function download(
  name: string,
  content: string | Blob,
  type = "text/plain;charset=utf-8",
) {
  const blob =
    typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
