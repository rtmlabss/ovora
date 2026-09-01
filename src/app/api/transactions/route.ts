import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import {
  customerCredits,
  financialTransactions,
  members,
  products,
  transactionItems,
  transactions,
  vouchers,
} from "@/db/schema";
import { POINT_VALUE } from "@/lib/pos";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

type PayMethod = "tunai" | "qris" | "transfer" | "kredit";

interface PostSaleItem {
  productId: number;
  qty: number;
}

interface PostSaleBody {
  branchId?: number;
  memberId?: number | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  serviceCharge?: number;
  pointsUsed?: number;
  total?: number;
  paymentMethod?: PayMethod;
  voucherCode?: string;
  items: PostSaleItem[];
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

export async function POST(request: Request) {
  const db = await ensureDb();
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
  const tax = Math.max(Math.floor(body.tax ?? 0), 0);
  const serviceCharge = Math.max(Math.floor(body.serviceCharge ?? 0), 0);
  const requestedPoints = Math.max(Math.floor(body.pointsUsed ?? 0), 0);
  const paymentMethod: PayMethod =
    body.paymentMethod === "qris" || body.paymentMethod === "transfer" || body.paymentMethod === "kredit"
      ? body.paymentMethod
      : "tunai";
  const voucherCode = body.voucherCode?.trim() || null;

  try {
    const sale = await db.transaction(async (tx) => {
      const productRows: { product: typeof products.$inferSelect; qty: number; unitPrice: number }[] = [];
      for (const item of body.items) {
        const productQuery = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        const product = productQuery[0];
        if (!product) throw new Error(`Produk ID ${item.productId} tidak ditemukan`);
        if (item.qty > product.stockQty) {
          throw new Error(`Stok ${product.name} tidak cukup (tersisa ${product.stockQty} ${product.unit})`);
        }
        productRows.push({
          product,
          qty: item.qty,
          unitPrice: product.price,
        });
      }

      const subtotal = productRows.reduce(
        (sum, r) => sum + Math.round(r.unitPrice * r.qty),
        0
      );
      const safeDiscount = Math.min(discount, subtotal);

      // Voucher validation
      let voucherDiscount = 0;
      let voucher: (typeof vouchers.$inferSelect) | null = null;
      if (voucherCode) {
        const voucherRows = await tx
          .select()
          .from(vouchers)
          .where(and(eq(vouchers.code, voucherCode), eq(vouchers.status, "aktif")))
          .limit(1);
        voucher = voucherRows[0] ?? null;
        if (voucher) {
          const now = new Date().toISOString();
          if (voucher.startDate <= now && voucher.endDate >= now) {
            if (!voucher.quota || voucher.usedCount < voucher.quota) {
              if (subtotal >= voucher.minPurchase) {
                if (voucher.type === "percentage") {
                  voucherDiscount = Math.min(Math.round(subtotal * (voucher.value / 100)), voucher.maxDiscount ?? subtotal);
                } else {
                  voucherDiscount = Math.min(voucher.value, subtotal);
                }
              }
            }
          }
        }
      }

      const afterDiscount = subtotal - safeDiscount - voucherDiscount;
      const taxAmount = Math.round(afterDiscount * (tax / 100));
      const serviceChargeAmount = Math.round(afterDiscount * (serviceCharge / 100));

      let maxPoints = Math.floor(afterDiscount / POINT_VALUE);
      let member: (typeof members.$inferSelect) | null = null;
      if (memberId) {
        const memberQuery = await tx.select().from(members).where(eq(members.id, memberId)).limit(1);
        member = memberQuery[0] ?? null;
        if (member) {
          maxPoints = Math.min(maxPoints, member.pointsBalance);
        }
      }
      const pointsUsed = Math.min(requestedPoints, maxPoints);
      const pointsDiscount = pointsUsed * POINT_VALUE;
      const total = Math.max(afterDiscount + taxAmount + serviceChargeAmount - pointsDiscount, 0);

      const now = new Date();
      const maxRows = await tx.select({ id: transactions.id }).from(transactions).orderBy(desc(transactions.id)).limit(1);
      const seq = (maxRows[0]?.id ?? 0) + 1;
      const invoiceNo = `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(seq).padStart(3, "0")}`;

      const txnRows = await tx
        .insert(transactions)
        .values({
          invoiceNo,
          branchId,
          memberId,
          subtotal,
          discount: safeDiscount,
          tax: taxAmount,
          serviceCharge: serviceChargeAmount,
          pointsUsed,
          total,
          paymentMethod,
          createdAt: now.toISOString(),
        })
        .returning({ id: transactions.id, invoiceNo: transactions.invoiceNo });
      const txn = txnRows[0];

      for (const row of productRows) {
        await tx.insert(transactionItems)
          .values({
            transactionId: txn.id,
            productId: row.product.id,
            qty: row.qty,
            price: row.unitPrice,
            subtotal: Math.round(row.unitPrice * row.qty),
          });
        await tx.update(products)
          .set({ stockQty: row.product.stockQty - row.qty })
          .where(eq(products.id, row.product.id));
      }

       let pointsEarned = 0;
      if (member) {
        pointsEarned = Math.floor(total / 1000);
        await tx.update(members)
          .set({ pointsBalance: member.pointsBalance - pointsUsed + pointsEarned })
          .where(eq(members.id, member.id));
      }

      // Increment voucher usage count
      if (voucher && voucherDiscount > 0) {
        await tx
          .update(vouchers)
          .set({ usedCount: voucher.usedCount + 1 })
          .where(eq(vouchers.id, voucher.id));
      }

      // Handle credit payment
      if (paymentMethod === "kredit" && memberId) {
        const creditRows = await tx.select().from(customerCredits).where(eq(customerCredits.memberId, memberId)).limit(1);
        const credit = creditRows[0];
        if (!credit) throw new Error("Member tidak memiliki akun kredit");
        if (credit.status !== "aktif") throw new Error("Akun kredit tidak aktif");
        if (credit.usedCredit + total > credit.creditLimit) throw new Error("Melebihi batas kredit");

        await tx.update(customerCredits)
          .set({ usedCredit: credit.usedCredit + total, updatedAt: now.toISOString() })
          .where(eq(customerCredits.memberId, memberId));
      }

      await tx.insert(financialTransactions)
        .values({
          branchId,
          type: paymentMethod === "kredit" ? "piutang" : "pemasukan",
          category: paymentMethod === "kredit" ? "Piutang Pelanggan" : "Penjualan",
          amount: total,
          note: `Transaksi ${invoiceNo}`,
          transactionId: txn.id,
          createdAt: now.toISOString(),
        });

      const result = {
        id: txn.id,
        invoiceNo: txn.invoiceNo,
        subtotal,
        discount: safeDiscount,
        voucherDiscount,
        tax: taxAmount,
        serviceCharge: serviceChargeAmount,
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

      // Log audit
      await logAudit({
        userId: null, // TODO: get from auth context
        action: "create",
        module: "transactions",
        resourceId: String(txn.id),
        newData: result,
        ipAddress: getClientIp(request),
      });

      return result;
    });

    return Response.json({ transaction: sale }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get("branchId")) || 1;
  const from = searchParams.get("from") ?? null;
  const to = searchParams.get("to") ?? null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 200);

  const filters = [eq(transactions.branchId, branchId)];
  if (from) filters.push(gte(transactions.createdAt, from));
  if (to) filters.push(lte(transactions.createdAt, to));

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  const ids = rows.map((r) => r.id);

  const items = ids.length
    ? await db
        .select()
        .from(transactionItems)
        .where(inArray(transactionItems.transactionId, ids))
    : [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productsFound = productIds.length
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  const productMap = new Map(productsFound.map((p) => [p.id, p]));

  const memberIds = [...new Set(rows.flatMap((r) => (r.memberId != null ? [r.memberId] : [])))];
  const membersFound = memberIds.length
    ? await db.select().from(members).where(inArray(members.id, memberIds))
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
    tax: r.tax,
    serviceCharge: r.serviceCharge,
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