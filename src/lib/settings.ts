export interface StoreProfile {
  name: string;
  owner: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  currency: string;
}

export interface BranchSetting {
  id: number;
  name: string;
  address: string;
  city: string;
  status: "aktif" | "libur";
}

export interface AccountUser {
  id: number;
  name: string;
  email: string;
  role: "Pemilik" | "Manager" | "Kasir";
  branch: string;
  status: "aktif" | "nonaktif";
  lastActive: string;
}

export interface AppPreference {
  notificationEmail: boolean;
  notificationWhatsapp: boolean;
  lowStockAlert: boolean;
  receiptFooter: boolean;
  autoIdle: boolean;
  darkMode: boolean;
  language: string;
}

export const MOCK_STORE_PROFILE: StoreProfile = {
  name: "ovora.id — Toko Telur",
  owner: "Pemilik Toko",
  phone: "0812-3456-7890",
  email: "pemilik@ovora.id",
  whatsapp: "0812-3456-7890",
  address: "Jl. Raya Telur No. 1",
  city: "Kota",
  currency: "IDR (Rp)",
};

export const MOCK_BRANCH_SETTINGS: BranchSetting[] = [
  { id: 1, name: "Toko Utama", address: "Jl. Raya Telur No. 1", city: "Kota", status: "aktif" },
  { id: 2, name: "Toko Cabang Panciro", address: "Jl. Merdeka No. 12", city: "Kota A", status: "aktif" },
  { id: 3, name: "Toko Cabang Delta", address: "Jl. Pemuda No. 3", city: "Kota B", status: "libur" },
];

export const MOCK_ACCOUNTS: AccountUser[] = [
  {
    id: 1,
    name: "Pemilik Toko",
    email: "pemilik@ovora.id",
    role: "Pemilik",
    branch: "Semua Cabang",
    status: "aktif",
    lastActive: "Baru saja",
  },
  {
    id: 2,
    name: "Nina Manager",
    email: "nina@ovora.id",
    role: "Manager",
    branch: "Toko Utama",
    status: "aktif",
    lastActive: "10 menit lalu",
  },
  {
    id: 3,
    name: "Andi Kasir",
    email: "andi@ovora.id",
    role: "Kasir",
    branch: "Toko Cabang Panciro",
    status: "aktif",
    lastActive: "1 jam lalu",
  },
  {
    id: 4,
    name: "Dewi Kasir",
    email: "dewi@ovora.id",
    role: "Kasir",
    branch: "Toko Cabang Delta",
    status: "nonaktif",
    lastActive: "3 hari lalu",
  },
];

export const MOCK_PREFERENCES: AppPreference = {
  notificationEmail: true,
  notificationWhatsapp: true,
  lowStockAlert: true,
  receiptFooter: true,
  autoIdle: false,
  darkMode: false,
  language: "Indonesia",
};

export type PermissionId =
  | "kasir"
  | "stok"
  | "keuangan"
  | "membership"
  | "leaderboard"
  | "monitoring"
  | "pengaturan"
  | "kelolaPengguna";

export interface PermissionDef {
  id: PermissionId;
  label: string;
  desc: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { id: "kasir", label: "Kasir Penjualan", desc: "Buat & kelola transaksi POS" },
  { id: "stok", label: "Manajemen Stok", desc: "Kelola barang masuk/keluar" },
  { id: "keuangan", label: "Pencatatan Keuangan", desc: "Lihat & catat transaksi keuangan" },
  { id: "membership", label: "Membership & Poin", desc: "Kelola member & poin" },
  { id: "leaderboard", label: "Leaderboard Reward", desc: "Kelola reward & pemenang" },
  { id: "monitoring", label: "Monitoring Cabang", desc: "Pantau kinerja cabang" },
  { id: "pengaturan", label: "Pengaturan", desc: "Akses halaman pengaturan" },
  { id: "kelolaPengguna", label: "Kelola Pengguna", desc: "Tambah/ubah/hapus akun" },
];

export type RoleId = "Pemilik" | "Manager" | "Kasir";

export const ROLES_WITH_PERMISSIONS: {
  id: RoleId;
  desc: string;
  count: number;
  permissions: PermissionId[];
}[] = [
  {
    id: "Pemilik",
    desc: "Akses penuh ke seluruh fitur & pengaturan",
    count: 1,
    permissions: PERMISSIONS.map((p) => p.id),
  },
  {
    id: "Manager",
    desc: "Kelola operasional tanpa kelola pengguna",
    count: 1,
    permissions: ["kasir", "stok", "keuangan", "membership", "leaderboard", "monitoring", "pengaturan"],
  },
  {
    id: "Kasir",
    desc: "Fokus transaksi penjualan kasir",
    count: 2,
    permissions: ["kasir", "stok"],
  },
];
