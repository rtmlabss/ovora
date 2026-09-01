"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { CheckIcon, PlusIcon, TrashIcon, EditIcon, XIcon, BuildingIcon } from "@/components/icons";

interface Branch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  status: "aktif" | "libur";
  productCount?: number;
}

const STATUSES = ["aktif", "libur"] as const;

export default function CabangPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    status: "aktif" as "aktif" | "libur",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      setMessage({ type: "error", text: "Gagal memuat cabang" });
    } finally {
      setLoading(false);
    }
  }

  function openForm(branch?: Branch) {
    if (branch) {
      setEditing(branch);
      setFormData({
        name: branch.name,
        address: branch.address || "",
        city: branch.city || "",
        status: branch.status,
      });
    } else {
      setEditing(null);
      setFormData({ name: "", address: "", city: "", status: "aktif" });
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Nama cabang wajib diisi" });
      return;
    }

    setSaving(true);
    try {
      const url = editing ? `/api/branches/${editing.id}` : "/api/branches";
      const method = editing ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: editing ? "Cabang berhasil diperbarui" : "Cabang berhasil ditambahkan" });
      closeForm();
      loadBranches();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(branch: Branch) {
    if (!confirm(`Hapus cabang "${branch.name}"? Pastikan tidak ada produk di cabang ini.`)) return;

    try {
      const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: "Cabang berhasil dihapus" });
      loadBranches();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Cabang</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola cabang toko Anda
            </p>
          </div>
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusIcon width={15} height={15} /> Tambah Cabang
          </button>
        </header>

        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Memuat cabang...
          </div>
        ) : branches.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Belum ada cabang. Klik "Tambah Cabang" untuk memulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingIcon width={20} height={20} className="text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">{branch.name}</h3>
                      <p className="text-xs text-muted-foreground">{branch.city || "—"}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    branch.status === "aktif" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {branch.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{branch.address || "—"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openForm(branch)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <EditIcon width={12} height={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(branch)}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <TrashIcon width={12} height={12} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {editing ? "Edit Cabang" : "Tambah Cabang"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <XIcon width={18} height={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Nama Cabang *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Contoh: Toko Cabang Delta"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Alamat</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Alamat lengkap cabang"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Nama kota"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "aktif" | "libur" })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <>Menyimpan...</>
                    ) : (
                      <>
                        <CheckIcon width={15} height={15} /> {editing ? "Perbarui" : "Simpan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}