"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminManageUsers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: any[] }>("/api/admin/users");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function suspend(id: string, suspended: boolean) {
    await apiFetch(`/api/admin/users/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ suspended })
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this user?")) return;
    await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = items.filter((u) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [u.name, u.email, u.phone, u.role].some((v: string) => String(v || "").toLowerCase().includes(needle));
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Users</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-3">
        {filtered.map((u) => (
          <div key={u._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">{u.name}</div>
                <div className="mt-1 text-sm text-slate-600">{u.email} • {u.phone}</div>
                <div className="mt-1 text-sm text-slate-600">Role: {u.role}</div>
              </div>
              <StatusPill value={u.status} />
            </div>

            {u.role !== "admin" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {u.status === "active" ? (
                  <Button variant="secondary" onClick={() => void suspend(u._id, true)}>
                    Suspend
                  </Button>
                ) : (
                  <Button onClick={() => void suspend(u._id, false)}>Unsuspend</Button>
                )}
                <Button variant="secondary" onClick={() => void remove(u._id)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        ))}

        {!loading && filtered.length === 0 ? <div className="text-sm text-slate-600">No users.</div> : null}
      </div>
    </Card>
  );
}
