// Production pipeline for a publishing order. Edit / reorder these to match your
// real workflow — the admin control and the author progress tracker both read
// from this single list, so changing it here updates everything.
export interface ProductionStage {
  key: string;
  label: string;
}

export const PRODUCTION_STAGES: ProductionStage[] = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'manuscript', label: 'Manuscript Received' },
  { key: 'editing', label: 'Editing & Proofreading' },
  { key: 'design', label: 'Cover & Interior Design' },
  { key: 'proof', label: 'Author Proof & Approval' },
  { key: 'printing', label: 'ISBN & Printing' },
  { key: 'distribution', label: 'Distribution & Listing' },
  { key: 'published', label: 'Published' },
];

// First stage every new order starts at (must match the DB column default).
export const FIRST_STAGE = PRODUCTION_STAGES[0].key;

export const stageIndex = (key: string | null | undefined): number =>
  PRODUCTION_STAGES.findIndex((s) => s.key === key);

export const stageLabel = (key: string | null | undefined): string =>
  PRODUCTION_STAGES.find((s) => s.key === key)?.label ?? 'Order Placed';
