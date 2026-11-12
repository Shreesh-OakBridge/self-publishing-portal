// Royalty maths shared by the homepage estimator and the /royalty-calculator page.
//
// Print royalty is a % of NET sales, where
//   net sales = MRP − GST (contained in the MRP) − store commission − print cost.
// eBook royalty is 100% of net receipts (shown separately in the UI).

export interface RoyaltyInputs {
  mrp: number; // cover price the reader pays (₹)
  printCost: number; // cost to print one copy (₹)
  commissionPct: number; // store / channel commission, % of MRP
  gstPct: number; // GST included in the MRP, % (printed books are generally exempt)
}

// GST portion contained in a GST-inclusive price.
const gstInside = (mrp: number, gstPct: number) => (gstPct > 0 ? mrp - mrp / (1 + gstPct / 100) : 0);

export function netSalesPerCopy({ mrp, printCost, commissionPct, gstPct }: RoyaltyInputs): number {
  const commission = (mrp * commissionPct) / 100;
  return Math.max(0, mrp - gstInside(mrp, gstPct) - commission - printCost);
}

export function printRoyaltyPerCopy(inputs: RoyaltyInputs, ratePct: number): number {
  return (netSalesPerCopy(inputs) * ratePct) / 100;
}

// Fallback print-royalty rates by plan name, used only if a plan in the CMS
// is missing its rate. Keep in line with Admin → Site Content → Pricing.
export const PLAN_ROYALTY_FALLBACK: Record<string, number> = {
  Starter: 80,
  Elevate: 70,
  Professional: 60,
  Custom: 50,
};
