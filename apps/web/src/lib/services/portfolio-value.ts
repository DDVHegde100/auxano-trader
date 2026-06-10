import { prisma } from "@auxano/database";
import { decimalToNumber } from "@auxano/shared";
import { getOrFetchQuote } from "./market";

export async function getPortfolioValue(userId: string): Promise<{
  totalValue: number;
  cashBalance: number;
  positionsValue: number;
  initialBalance: number;
  allTimeReturnPct: number;
} | null> {
  const account = await prisma.paperAccount.findUnique({
    where: { userId },
    include: { positions: true },
  });
  if (!account) return null;

  const cash = decimalToNumber(account.cashBalance);
  const initial = decimalToNumber(account.initialBalance);
  let posVal = 0;
  for (const p of account.positions) {
    const live = await getOrFetchQuote(p.symbol);
    posVal += decimalToNumber(p.quantity) * (live?.price ?? 0);
  }
  const total = cash + posVal;
  return {
    totalValue: total,
    cashBalance: cash,
    positionsValue: posVal,
    initialBalance: initial,
    allTimeReturnPct: initial > 0 ? ((total - initial) / initial) * 100 : 0,
  };
}
