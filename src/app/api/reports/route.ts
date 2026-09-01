import { and, desc, eq, gte, inArray, lte, sql, sum as drizzleSum, count as drizzleCount } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { products, transactions, transactionItems, members, financialTransactions, purchaseOrderItems, purchaseOrders, stockMovements } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // sales, profit, stock-aging, top-customers
  const branchId = Number(searchParams.get("branchId")) || null;
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;

  if (type === "sales") {
    const filters = [];
    if (branchId) filters.push(eq(transactions.branchId, branchId));
    if (from) filters.push(gte(transactions.createdAt, from));
    if (to) filters.push(lte(transactions.createdAt, to));

    const data = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        total: drizzleSum(transactions.total),
        count: drizzleCount(transactions.id),
      })
      .from(transactions)
      .where(and(...filters))
      .groupBy(sql`DATE(${transactions.createdAt})`);
    
    return Response.json({ data });
  }

  if (type === "profit") {
    const filters = branchId ? [eq(transactions.branchId, branchId)] : [];
    if (from) filters.push(gte(transactions.createdAt, from));
    if (to) filters.push(lte(transactions.createdAt, to));

    // Get all transactions with items
    const txns = await db
      .select()
      .from(transactions)
      .where(and(...filters));

    const txnIds = txns.map(t => t.id);
    if (txnIds.length === 0) {
      return Response.json({ data: { totalRevenue: 0, totalCost: 0, grossProfit: 0, margin: 0 } });
    }

    const items = await db
      .select()
      .from(transactionItems)
      .where(inArray(transactionItems.transactionId, txnIds));

    // Get average cost price from received POs for each product
    const productIds = [...new Set(items.map(i => i.productId))];
    const poItems = await db
      .select()
      .from(purchaseOrderItems)
      .where(inArray(purchaseOrderItems.productId, productIds));

    // Calculate average cost per product
    const costMap = new Map<number, number>();
    const costCount = new Map<number, number>();
    for (const poi of poItems) {
      const existing = costMap.get(poi.productId) || 0;
      const cnt = costCount.get(poi.productId) || 0;
      costMap.set(poi.productId, existing + poi.costPrice);
      costCount.set(poi.productId, cnt + 1);
    }
    
    const avgCostMap = new Map<number, number>();
    for (const [pid, total] of costMap) {
      avgCostMap.set(pid, total / (costCount.get(pid) || 1));
    }

    let totalRevenue = 0;
    let totalCost = 0;
    for (const item of items) {
      const revenue = item.price * item.qty;
      const cost = (avgCostMap.get(item.productId) || 0) * item.qty;
      totalRevenue += revenue;
      totalCost += cost;
    }

    return Response.json({ 
      data: { 
        totalRevenue: Math.round(totalRevenue), 
        totalCost: Math.round(totalCost), 
        grossProfit: Math.round(totalRevenue - totalCost),
        margin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0
      } 
    });
  }

  if (type === "stock-aging") {
    const days = Number(searchParams.get("days")) || 30;
    // We don't have updated_at in products, so use a different approach
    // Check products with no recent stock movements
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get products with stock > 0
    const prods = await db
      .select()
      .from(products)
      .where(and(eq(products.stockQty > 0), branchId ? eq(products.branchId, branchId) : sql`1=1`));

    // Get recent stock movements
    const recentMovements = await db
      .select({ productId: stockMovements.productId })
      .from(stockMovements)
      .where(gte(stockMovements.createdAt, cutoffDate.toISOString()));
    
    const recentProductIds = new Set(recentMovements.map(m => m.productId));
    
    const aged = prods
      .filter(p => !recentProductIds.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        stockQty: p.stockQty,
        branchId: p.branchId,
      }));

    return Response.json({ data: aged });
  }

  if (type === "top-customers") {
    const filters = branchId ? [eq(transactions.branchId, branchId)] : [];
    if (from) filters.push(gte(transactions.createdAt, from));
    if (to) filters.push(lte(transactions.createdAt, to));

    const data = await db
      .select({
        memberId: transactions.memberId,
        memberName: members.name,
        totalSpent: drizzleSum(transactions.total),
        visitCount: drizzleCount(transactions.id),
      })
      .from(transactions)
      .leftJoin(members, eq(transactions.memberId, members.id))
      .where(and(...filters))
      .groupBy(transactions.memberId, members.name)
      .orderBy(desc(sql`totalSpent`))
      .limit(10);
    
    return Response.json({ data });
  }

  if (type === "stock-value") {
    const filter = branchId ? [eq(products.branchId, branchId)] : [];
    const data = await db
      .select({
        totalStockValue: drizzleSum(sql`${products.stockQty} * ${products.price}`),
        totalItems: drizzleCount(products.id),
      })
      .from(products)
      .where(and(...filter));

    return Response.json({ data: data[0] });
  }

  return Response.json({ error: "Tipe laporan tidak valid" }, { status: 400 });
}
