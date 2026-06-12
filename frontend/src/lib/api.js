export async function apiFetch(path, { token, method, body } = {}) {
  const res = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const base = data?.error || `Erro HTTP ${res.status}`;
    const msg = data?.details ? `${base} (${data.details})` : base;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

