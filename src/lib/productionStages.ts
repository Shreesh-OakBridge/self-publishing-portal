// Production pipeline for a publishing order.
//
// This file's PRODUCTION_STAGES array is only the *fallback default* — the
// live, admin-editable list lives in CMS content at
// site_content.projectWorkspace.stages (see src/content/defaults.ts), edited
// from Admin → Site Content → Project Workspace. Components should read the
// real list via useContent().projectWorkspace.stages and pass it into the
// helpers below; PRODUCTION_STAGES here just seeds that default and acts as a
// safety net before content has loaded.
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

export const stageIndex = (stages: ProductionStage[], key: string | null | undefined): number =>
  stages.findIndex((s) => s.key === key);

export const stageLabel = (stages: ProductionStage[], key: string | null | undefined): string =>
  stages.find((s) => s.key === key)?.label ?? stages[0]?.label ?? 'Order Placed';
