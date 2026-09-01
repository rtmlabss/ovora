"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/app-shell";
import { CameraIcon, CheckIcon, MapPinIcon, MapIcon, UserIcon, ClockIcon, XIcon } from "@/components/icons";

export default function AbsensiPage() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [address, setLocationAddress] = useState<string>("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<"tepat" | "telat" | "dini">("tepat");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraOpen] = useState(false);

  useEffect(() => {
    // Get location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          // Reverse geocoding could be done here with Google Maps API
          setLocationAddress(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        },
        (err) => {
          setMessage({ type: "error", text: "Gagal mendapatkan lokasi GPS. Pastikan GPS aktif." });
        }
      );
    }
  }, []);

  async function startCamera() {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMessage({ type: "error", text: "Gagal mengakses kamera." });
      setCameraOpen(false);
    }
  }

  function takePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraOpen(false);
  }

  async function handleSubmit(type: "masuk" | "pulang") {
    if (!location) {
      setMessage({ type: "error", text: "Lokasi GPS wajib didapatkan sebelum absensi." });
      return;
    }
    if (!photo) {
      setMessage({ type: "error", text: "Foto selfie wajib diambil." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1, // Mock user ID, should get from auth
          branchId: 1, // Mock branch ID, should get from user profile
          type,
          selfiePhoto: photo,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          locationAddress: address,
          deviceInfo: navigator.userAgent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Absensi ${type} berhasil dicatat!` });
      setPhoto(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Absensi Karyawan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lakukan absensi masuk/pulang dengan foto selfie dan lokasi GPS
          </p>
        </header>

        {message && (
          <div className={`mb-6 rounded-lg p-4 text-sm ${
            message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Lokasi & Status */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPinIcon width={18} height={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">Lokasi Anda</h2>
              </div>
              
              {location ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">Koordinat Terdeteksi:</p>
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg font-mono">
                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground">Akurasi: ±{location.accuracy.toFixed(1)} meter</p>
                  <a 
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                  >
                    <MapIcon width={12} height={12} /> Lihat di Google Maps
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground animate-pulse italic">Mencari lokasi GPS...</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon width={18} height={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">Status Kehadiran</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jam Sekarang:</span>
                  <span className="text-sm font-bold text-foreground">{new Date().toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    status === "tepat" ? "bg-success/10 text-success" : status === "telat" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kamera & Foto */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <CameraIcon width={18} height={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">Foto Selfie</h2>
              </div>

              <div className="aspect-[4/3] bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                {cameraActive ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : photo ? (
                  <img src={photo} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <CameraIcon width={48} height={48} className="mx-auto text-muted-foreground opacity-20 mb-2" />
                    <p className="text-xs text-muted-foreground">Kamera tidak aktif</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="mt-4 flex gap-2">
                {!cameraActive && !photo && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Buka Kamera
                  </button>
                )}
                {cameraActive && (
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
                  >
                    Ambil Foto
                  </button>
                )}
                {photo && !cameraActive && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Ulangi Foto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            disabled={loading || !photo || !location}
            onClick={() => handleSubmit("masuk")}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-success px-6 py-4 text-base font-bold text-white shadow-lg shadow-success/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Memproses..." : (
              <>
                <CheckIcon width={20} height={20} /> Clock-In (Masuk)
              </>
            )}
          </button>
          <button
            type="button"
            disabled={loading || !photo || !location}
            onClick={() => handleSubmit("pulang")}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Memproses..." : (
              <>
                <XIcon width={20} height={20} /> Clock-Out (Pulang)
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
