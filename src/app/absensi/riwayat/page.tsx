"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { CalendarIcon, ClockIcon, MapPinIcon, CameraIcon, CheckIcon, AlertTriangleIcon, ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { DAY_NAMES } from "@/lib/attendance";

interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  branchId: number;
  branchName: string;
  type: "masuk" | "pulang";
  photoUrl: string | null;
  selfiePhoto: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  locationAddress: string | null;
  timestamp: string;
  deviceInfo: string | null;
  status: "tepat" | "telat" | "dini";
  note: string | null;
  createdAt: string;
}

export default function RiwayatAbsensiPage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ 
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [filter, setFilter] = useState<{ userId?: number; branchId?: number; type?: "masuk" | "pulang" }>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAttendances();
  }, []);

  async function loadAttendances() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendances?from=${dateRange.from}&to=${dateRange.to}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch (err) {
      setMessage({ type: "error", text: "Gagal memuat riwayat absensi" });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("id-ID");
  }

  function getStatusColor(status: string) {
    if (status === "telat") return "bg-error/10 text-error";
    if (status === "dini") return "bg-primary/10 text-primary";
    return "bg-success/10 text-success";
  }

  function getStatusIcon(status: string) {
    if (status === "telat") return <AlertTriangleIcon width={14} height={14} />;
    if (status === "dini") return <ArrowUpIcon width={14} height={14} />;
    return <CheckIcon width={14} height={14} />;
  }

  function getDayName(dateStr: string) {
    const date = new Date(dateStr);
    return DAY_NAMES[date.getDay()];
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Riwayat Absensi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lihat riwayat absensi karyawan dengan foto dan lokasi GPS
          </p>
        </header>

        {message && (
          <div className={`mb-6 rounded-lg p-4 text-sm ${
            message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon width={16} height={16} className="text-primary" />
              <span className="text-sm font-medium">Rentang Waktu</span>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <span className="text-sm text-muted-foreground">s/d</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={loadAttendances}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Terapkan Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Memuat riwayat absensi...
          </div>
        ) : attendances.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Tidak ada riwayat absensi untuk periode ini.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-3 pr-3 font-medium">Tanggal</th>
                  <th className="py-3 pr-3 font-medium">Hari</th>
                  <th className="py-3 pr-3 font-medium">Karyawan</th>
                  <th className="py-3 pr-3 font-medium">Cabang</th>
                  <th className="py-3 pr-3 font-medium">Jenis</th>
                  <th className="py-3 pr-3 font-medium">Waktu</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-3 font-medium">Lokasi</th>
                  <th className="py-3 pr-3 font-medium">Foto</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(attendance.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-xs text-muted-foreground">
                        {getDayName(attendance.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-foreground">
                        {attendance.userName}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-muted-foreground">
                        {attendance.branchName}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className={`font-medium text-foreground ${attendance.type === "masuk" ? "text-primary" : "text-secondary"}`}>
                        {attendance.type === "masuk" ? "Masuk" : "Pulang"}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-sm text-foreground">
                        {formatTime(attendance.timestamp)}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className={`flex items-center gap-1 text-xs ${getStatusColor(attendance.status)}`}>
                        {getStatusIcon(attendance.status)}
                        <span>{attendance.status}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPinIcon width={12} height={12} />
                        <span className="truncate max-w-[120px]">
                          {attendance.locationAddress || `${attendance.latitude.toFixed(4)}, ${attendance.longitude.toFixed(4)}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      {attendance.selfiePhoto ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                          <img
                            src={attendance.selfiePhoto}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                          <CameraIcon width={16} height={16} className="opacity-30" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
