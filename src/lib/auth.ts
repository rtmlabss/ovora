export interface AuthUser {
  name: string;
  email: string;
  role: "Pemilik" | "Manager" | "Kasir";
  branch: string;
}

export const MOCK_ADMIN = {
  email: "pemilik@ovora.id",
  password: "ovora123",
};

export function mockLogin(
  email: string,
  password: string
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (normalized !== MOCK_ADMIN.email) {
    return { ok: false, error: "Email tidak ditemukan" };
  }
  if (password !== MOCK_ADMIN.password) {
    return { ok: false, error: "Kata sandi salah" };
  }
  return {
    ok: true,
    user: {
      name: "Pemilik Toko",
      email: normalized,
      role: "Pemilik",
      branch: "Semua Cabang",
    },
  };
}
