import { count } from "drizzle-orm";
import type { DB } from "@/db/type";
import { hashPassword } from "@/lib/password";
import { branches, branchStocks, financialTransactions, members, pointMovements, products, rewardWinners, rewards, stockMovements, storeProfiles, transactionItems, transactions, users } from "@/db/schema";

const PRODUCT_SEED = [
  { name: "Telur Ayam Negeri", unit: "kg", price: 28_000, stockQty: 45, minStock: 10 },
  { name: "Telur Ayam Kampung", unit: "kg", price: 38_000, stockQty: 12, minStock: 5 },
  { name: "Telur Itik", unit: "kg", price: 33_000, stockQty: 20, minStock: 5 },
  { name: "Telur Bebek", unit: "kg", price: 35_000, stockQty: 8, minStock: 5 },
  { name: "Telur Puyuh", unit: "papan", price: 12_000, stockQty: 30, minStock: 10 },
  { name: "Telur Ayam Omega-3", unit: "kg", price: 44_000, stockQty: 6, minStock: 3 },
];

const MEMBER_SEED = [
  { name: "John Doe", phone: "081234567890", email: "john@example.com", pointsBalance: 150 },
  { name: "Jane Smith", phone: "081298765432", email: "jane@example.com", pointsBalance: 85 },
];

function isoDate(date: Date) {
  return date.toISOString();
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function invoiceNo(date: Date, seq: number) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `INV-${y}${m}${d}-${pad(seq, 3)}`;
}

export function seedIfEmpty(db: DB) {
  const [{ value: branchCount }] = db.select({ value: count() }).from(branches).all();
  if (branchCount > 0) return;

  const branchId = db
    .insert(branches)
    .values({ name: "Toko Utama", address: "Jl. Raya Telur No. 1", city: "Kota" })
    .returning({ id: branches.id })
    .get().id;

  db.insert(branches)
    .values([      { name: "Toko Cabang Panciro", address: "Jl. Merdeka No. 12", city: "Kota A", status: "aktif" },
      { name: "Toko Cabang Delta", address: "Jl. Pemuda No. 3", city: "Kota B", status: "libur" },
    ])
    .returning({ id: branches.id, name: branches.name })
    .all();

  const productIds = db
    .insert(products)
    .values(PRODUCT_SEED.map((p) => ({ branchId, ...p })))
    .returning({ id: products.id })
    .all()
    .map((r) => r.id);

  const branchRows = db
    .select({ id: branches.id, name: branches.name })
    .from(branches)
    .all();
  const branchStockRows: Array<{ branchId: number; productId: number; stockQty: number; minStock: number }> = [];
  const base = [45, 12, 20, 8, 30, 6];
  for (const b of branchRows) {
    productIds.forEach((pid, i) => {
      branchStockRows.push({
        branchId: b.id,
        productId: pid,
        stockQty: b.id === branchId ? base[i] : Math.max(0, base[i] - i - (b.id % 3)),
        minStock: 5,
      });
    });
  }
  db.insert(branchStocks).values(branchStockRows).run();

  insertDefaultUsers(db, branchRows);

  const memberRows = db
    .insert(members)
    .values(MEMBER_SEED.map((m) => ({ branchId, ...m })))
    .returning({ id: members.id })
    .all();

  const now = new Date();
  const iso = (date: Date) => date.toISOString();

  db.insert(pointMovements)
    .values([
      {
        memberId: memberRows[0].id,
        branchId,
        kind: "perolehan",
        points: 54,
        note: "Transaksi INV-20260830-042",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30)),
      },
      {
        memberId: memberRows[0].id,
        branchId,
        kind: "penukaran",
        points: -20,
        note: "Tukar poin untuk potongan Rp2.000",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)),
      },
      {
        memberId: memberRows[0].id,
        branchId,
        kind: "perolehan",
        points: 36,
        note: "Transaksi INV-20260828-011",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 10, 15)),
      },
      {
        memberId: memberRows[1].id,
        branchId,
        kind: "perolehan",
        points: 20,
        note: "Transaksi INV-20260829-018",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 5)),
      },
    ])
    .run();

  db.insert(financialTransactions)
    .values({
      branchId,
      type: "pengeluaran",
      category: "Belanja Stok",
      amount: 1_200_000,
      note: "Belanja telur dari peternak hari ini",
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30).toISOString(),
    })
    .run();

  db.insert(stockMovements)
    .values([
      {
        branchId,
        productId: productIds[0],
        type: "masuk",
        qty: 50,
        note: "Restock dari peternak Pak Santo",
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 45).toISOString(),
      },
      {
        branchId,
        productId: productIds[4],
        type: "masuk",
        qty: 20,
        note: "Setoran gudang cabang",
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 10).toISOString(),
      },
      {
        branchId,
        productId: productIds[0],
        type: "keluar",
        qty: 10,
        note: "Stok rusak saat packing",
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 5).toISOString(),
      },
    ])
    .run();

  let seq = 1;
  for (const b of branchRows) {
    const bProducts = b.id === branchId ? productIds : productIds;
    const bMemberRows = b.id === branchId ? memberRows : memberRows;
    for (let dayAgo = 13; dayAgo >= 0; dayAgo--) {
      const base = new Date(now);
      base.setDate(base.getDate() - dayAgo);
      const countTxn = dayAgo === 0 ? 3 : 2 + ((dayAgo * 7 + b.id) % 3);
      for (let i = 0; i < countTxn; i++) {
        const hour = 9 + ((i * 5 + dayAgo + b.id) % 11);
        const at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, (i * 17 + b.id * 3) % 60);
        if (at > now) continue;

        const picks: { productId: number; qty: number }[] = [];
        const pickCount = 1 + ((i + dayAgo + b.id) % 2);
        for (let p = 0; p < pickCount; p++) {
          const productId = bProducts[(i + p + dayAgo + b.id) % bProducts.length];
          const existing = picks.find((x) => x.productId === productId);
          if (existing) existing.qty += 1 + (p % 2);
          else picks.push({ productId, qty: 1 + (p % 2) });
        }

        let subtotal = 0;
        for (const pick of picks) {
          const product = PRODUCT_SEED[bProducts.indexOf(pick.productId)];
          subtotal += product.price * pick.qty;
        }

        const useMember = i % 2 === 1 && bMemberRows.length > 0;
        const discount = subtotal >= 100_000 ? Math.round(subtotal * 0.05) : 0;
        const pointsUsed = useMember ? Math.min(10 + i, 40) : 0;
        const pointsDiscount = pointsUsed * 100;
        const total = Math.max(subtotal - discount - pointsDiscount, 0);

        const txn = db
          .insert(transactions)
          .values({
            invoiceNo: `INV-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(seq, 3)}`,
            branchId: b.id,
            memberId: useMember ? bMemberRows[i % bMemberRows.length].id : null,
            subtotal,
            discount,
            pointsUsed,
            total,
            paymentMethod: i % 3 === 2 ? "qris" : "tunai",
            createdAt: at.toISOString(),
          })
          .returning({ id: transactions.id })
          .get();
        seq += 1;

        db.insert(transactionItems)
          .values(
            picks.map((pick) => {
              const product = PRODUCT_SEED[bProducts.indexOf(pick.productId)];
              return {
                transactionId: txn.id,
                productId: pick.productId,
                qty: pick.qty,
                price: product.price,
                subtotal: product.price * pick.qty,
              };
            })
          )
          .run();
      }
    }
  }

  const rewardId = db
    .insert(rewards)
    .values({
      period: "2026-07",
      title: "Reward Juli 2026",
      createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 26)),
    })
    .returning({ id: rewards.id })
    .get().id;

  db.insert(rewardWinners)
    .values([
      {
        rewardId,
        memberId: memberRows[0].id,
        rank: 1,
        status: "diserahkan",
        deliveredDate: new Date(now.getFullYear(), now.getMonth() - 1, 28).toISOString().slice(0, 10),
        note: "Diserahkan saat kunjungan",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 27)),
      },
      {
        rewardId,
        memberId: memberRows[1].id,
        rank: 2,
        status: "dijadwalkan",
        createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 27)),
      },
    ])
    .run();

  db.insert(storeProfiles)
    .values({
      name: "Toko Telur ovora",
      tagline: "Telur segar pilihan setiap hari",
      address: "Jl. Raya Telur No. 1",
      city: "Kota",
      phone: "081234567890",
      currency: "IDR",
      description: "Pemasok telur berkualitas untuk retail & pelanggan setia.",
      updatedAt: iso(new Date()),
    })
    .run();
}

function insertDefaultUsers(db: DB, branchRows: Array<{ id: number; name: string }>) {
  const seededAt = new Date().toISOString();
  const firstId = branchRows[0]?.id;
  if (!firstId) return;
  const userRows = [
    { name: "Pemilik Toko", email: "pemilik@ovora.id", passwordHash: hashPassword("ovora123"), role: "Pemilik", status: "aktif", branchId: firstId, createdAt: seededAt },
    { name: "Nina Manager", email: "nina@ovora.id", passwordHash: hashPassword("ovora123"), role: "Manager", status: "aktif", branchId: firstId, createdAt: seededAt },
    { name: "Andi Kasir", email: "andi@ovora.id", passwordHash: hashPassword("ovora123"), role: "Kasir", status: "aktif", branchId: firstId, createdAt: seededAt },
    { name: "Sari Kasir", email: "sari@ovora.id", passwordHash: hashPassword("ovora123"), role: "Kasir", status: "nonaktif", branchId: branchRows[1]?.id ?? firstId, createdAt: seededAt },
  ];
  db.insert(users).values(userRows).run();
}

export function seedDefaultUsers(db: DB) {
  const [{ value: userCount }] = db.select({ value: count() }).from(users).all();
  if (userCount > 0) return;
  const rows = db.select({ id: branches.id, name: branches.name }).from(branches).all();
  insertDefaultUsers(db, rows);
}
