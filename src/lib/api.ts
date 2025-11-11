const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/gs";

export async function apiList() {
  const r = await fetch(`${API_BASE}?route=list`, { cache: "no-store" });
  return r.json(); // { ok, data|error }
}

export async function apiCreate(task: any) {
  const r = await fetch(`${API_BASE}?route=create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return r.json(); // { ok, id } | { ok:false, error }
}

export async function apiUpdate(id: string, patch: any) {
  const r = await fetch(`${API_BASE}?route=update&id=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return r.json();
}
