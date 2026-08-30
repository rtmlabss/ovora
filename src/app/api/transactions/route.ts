import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import {
  financialTransactions,
  members,
  products,
  transactionItems,
  transactions,
} from "@/db/schema";
import { POINT_VALUE } from "@/lib/pos";

export const dynamic = "force-dynamic";

type PayMethod = "tunai" | "qris" | "transfer";

interface PostSaleItem {
  productId: number;
  qty: number;
}

interface PostSaleBody {
  branchId?: number;
  memberId?: number | null;
  subtotal?: number;
  discount?: number;
  pointsUsed?: number;
  total?: number;
  paymentMethod?: PayMethod;
  items: PostSaleItem[];
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

export async function POST(request: Request) {
  const db = ensureDb();
  let body: PostSaleBody;
  try {
    body = (await request.json()) as PostSaleBody;
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Transaksi minimal berisi satu item" }, { status: 400 });
  }

  for (const item of body.items) {
    if (!item.productId || !(item.qty > 0)) {
      return Response.json({ error: "Item tidak valid" }, { status: 400 });
    }
  }

  const branchId = body.branchId ?? 1;
  const memberId = body.memberId || null;
  const discount = Math.max(Math.floor(body.discount ?? 0), 0);
  const requestedPoints = Math.max(Math.floor(body.pointsUsed ?? 0), 0);
  const paymentMethod: PayMethod =
    body.paymentMethod === "qris" || body.paymentMethod === "transfer" ? body.paymentMethod : "tunai";

  try {
    const sale = db.transaction((tx) => {
      const productRows = body.items.map((item) => {
        const product = tx.select().from(products).where(eq(products.id, item.productId)).get();
        if (!product) throw new Error(`Produk ID ${item.productId} tidak ditemukan`);
        if (item.qty > product.stockQty) {
          throw new Error(`Stok ${product.name} tidak cukup (tersisa ${product.stockQty} ${product.unit})`);
        }
        return {
          product,
          qty: item.qty,
          unitPrice: product.price,
        };
      });

      const subtotal = productRows.reduce(
        (sum, r) => sum + Math.round(r.unitPrice * r.qty),
        0
      );
      const safeDiscount = Math.min(discount, subtotal);

      let maxPoints = Math.floor((subtotal - safeDiscount) / POINT_VALUE);
      let member = null;
      if (memberId) {
        member = tx.select().from(members).where(eq(members.id, memberId)).get();
        if (member) {
          maxPoints = Math.min(maxPoints, member.pointsBalance);
        }
      }
      const pointsUsed = Math.min(requestedPoints, maxPoints);
      const pointsDiscount = pointsUsed * POINT_VALUE;
      const total = Math.max(subtotal - safeDiscount - pointsDiscount, 0);

      const now = new Date();
      const maxRow = tx.select({ id: transactions.id }).from(transactions).orderBy(desc(transactions.id)).limit(1).all();
      const seq = (maxRow[0]?.id ?? 0) + 1;
      const invoiceNo = `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(seq).padStart(3, "0")}`;

      const txn = tx
        .insert(transactions)
        .values({
          invoiceNo,
          branchId,
          memberId,
          subtotal,
          discount: safeDiscount,
          pointsUsed,
          total,
          paymentMethod,
          createdAt: now.toISOString(),
        })
        .returning({ id: transactions.id, invoiceNo: transactions.invoiceNo })
        .get();

      for (const row of productRows) {
        tx.insert(transactionItems)
          .values({
            transactionId: txn.id,
            productId: row.product.id,
            qty: row.qty,
            price: row.unitPrice,
            subtotal: Math.round(row.unitPrice * row.qty),
          })
          .run();
        tx.update(products)
          .set({ stockQty: row.product.stockQty - row.qty })
          .where(eq(products.id, row.product.id))
          .run();
      }

      let pointsEarned = 0;
      if (member) {
        pointsEarned = Math.floor(total / 1000);
        tx.update(members)
          .set({ pointsBalance: member.pointsBalance - pointsUsed + pointsEarned })
          .where(eq(members.id, member.id))
          .run();
      }

      tx.insert(financialTransactions)
        .values({
          branchId,
          type: "pemasukan",
          category: "Penjualan",
          amount: total,
          note: `Transaksi ${invoiceNo}`,
          transactionId: txn.id,
          createdAt: now.toISOString(),
        })
        .run();

      return {
        id: txn.id,
        invoiceNo: txn.invoiceNo,
        subtotal,
        discount: safeDiscount,
        pointsUsed,
        pointsDiscount,
        pointsEarned,
        total,
        paymentMethod,
        memberId,
        branchId,
        change: paymentMethod === "tunai" ? Math.max(Math.floor(body.total ?? total) - total, 0) : 0,
        createdAt: now.toISOString(),
        items: productRows.map((r) => ({
          productId: r.product.id,
          name: r.product.name,
          unit: r.product.unit,
          qty: r.qty,
          price: r.unitPrice,
          subtotal: Math.round(r.unitPrice * r.qty),
        })),
      };
    });

    return Response.json({ transaction: sale }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const db = ensureDb();
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get("branchId")) || 1;
  const from = searchParams.get("from") ?? null;
  const to = searchParams.get("to") ?? null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 200);

  const filters = [eq(transactions.branchId, branchId)];
  if (from) filters.push(gte(transactions.createdAt, from));
  if (to) filters.push(lte(transactions.createdAt, to));

  const rows = db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .all();

  const ids = rows.map((r) => r.id);

  const items = ids.length
    ? db
        .select()
        .from(transactionItems)
        .where(inArray(transactionItems.transactionId, ids))
        .all()
    : [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productsFound = productIds.length
    ? db.select().from(products).where(inArray(products.id, productIds)).all()
    : [];
  const productMap = new Map(productsFound.map((p) => [p.id, p]));

  const memberIds = [...new Set(rows.flatMap((r) => (r.memberId != null ? [r.memberId] : [])))];
  const membersFound = memberIds.length
    ? db.select().from(members).where(inArray(members.id, memberIds)).all()
    : [];
  const memberMap = new Map(membersFound.map((m) => [m.id, m]));

  const transactionsOut = rows.map((r) => ({
    id: r.id,
    invoiceNo: r.invoiceNo,
    branchId: r.branchId,
    memberId: r.memberId,
    memberName: r.memberId != null ? (memberMap.get(r.memberId)?.name ?? null) : null,
    subtotal: r.subtotal,
    discount: r.discount,
    pointsUsed: r.pointsUsed,
    total: r.total,
    paymentMethod: r.paymentMethod,
    createdAt: r.createdAt,
    items: items
      .filter((i) => i.transactionId === r.id)
      .map((i) => ({
        productId: i.productId,
        name: productMap.get(i.productId)?.name ?? "Produk",
        qty: i.qty,
        price: i.price,
        subtotal: i.subtotal,
      })),
  }));

  return Response.json({ total: transactionsOut.length, transactions: transactionsOut });
}