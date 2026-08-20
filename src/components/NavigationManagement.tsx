import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, RotateCcw, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { useContent } from '../content/ContentProvider';
import { defaultContent } from '../content/defaults';
import type { NavigationContent, NavLink, FooterColumn } from '../content/defaults';

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

const input =
  'px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';
const iconBtn = 'p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30';

// Reusable editor for a flat list of links.
function LinkListEditor({ links, onChange }: { links: NavLink[]; onChange: (l: NavLink[]) => void }) {
  const upd = (i: number, patch: Partial<NavLink>) => onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border rounded-lg p-2">
          <input
            type="checkbox"
            checked={l.enabled}
            onChange={(e) => upd(i, { enabled: e.target.checked })}
            className="w-4 h-4 accent-amber-600 flex-shrink-0"
            title={l.enabled ? 'Visible — click to hide' : 'Hidden — click to show'}
          />
          <input className={`${input} flex-1 min-w-0`} value={l.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Label" />
          <input className={`${input} flex-1 min-w-0`} value={l.url} onChange={(e) => upd(i, { url: e.target.value })} placeholder="/path · #section · https://…" />
          <button onClick={() => onChange(move(links, i, i - 1))} disabled={i === 0} className={iconBtn} title="Move up">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button onClick={() => onChange(move(links, i, i + 1))} disabled={i === links.length - 1} className={iconBtn} title="Move down">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={() => onChange(links.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Remove">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...links, { label: 'New link', url: '/', enabled: true }])}
        className="inline-flex items-center gap-1 text-amber-700 text-sm font-semibold hover:text-amber-900"
      >
        <Plus className="w-4 h-4" /> Add link
      </button>
    </div>
  );
}

export default function NavigationManagement() {
  const { navigation } = useContent();
  const [nav, setNav] = useState<NavigationContent>(() => clone(navigation));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const dirty = () => setStatus(null);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from('site_content').upsert({
      key: 'navigation',
      value: nav,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setStatus(
      error
        ? { type: 'err', msg: 'Could not save. Please try again.' }
        : { type: 'ok', msg: 'Saved. Refresh the site to see the changes.' },
    );
  };
  const reset = () => {
    setNav(clone(defaultContent.navigation));
    setStatus({ type: 'ok', msg: 'Reset to defaults — remember to Save.' });
  };

  // Footer column helpers
  const setCols = (cols: FooterColumn[]) => {
    setNav((n) => ({ ...n, footerColumns: cols }));
    dirty();
  };
  const updCol = (i: number, patch: Partial<FooterColumn>) => setCols(nav.footerColumns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const sectionTitle = 'text-lg font-bold text-gray-900';

  return (
    <div className="max-w-3xl space-y-10">
      {status && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${status.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{status.msg}</span>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Manage the header tabs and every footer element. A link’s destination can be an in-app page
        (<code>/plans</code>), a homepage section (<code>#testimonials</code>), or an external URL
        (<code>https://…</code>). Untick the box to hide a link without deleting it.
      </p>

      {/* Header */}
      <section>
        <h3 className={`${sectionTitle} mb-3`}>Header navigation</h3>
        <p className="text-xs text-gray-400 mb-3">
          The Log In / Get Started / account controls are always shown and aren’t listed here. A tab whose URL is
          <code> /services</code> keeps its dropdown menu.
        </p>
        <LinkListEditor links={nav.header} onChange={(header) => { setNav((n) => ({ ...n, header })); dirty(); }} />
      </section>

      {/* Footer columns */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className={sectionTitle}>Footer link columns</h3>
          <button
            onClick={() => setCols([...nav.footerColumns, { heading: 'New column', enabled: true, links: [] }])}
            className="inline-flex items-center gap-1 text-amber-700 text-sm font-semibold hover:text-amber-900"
          >
            <Plus className="w-4 h-4" /> Add column
          </button>
        </div>
        <div className="space-y-5">
          {nav.footerColumns.map((col, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/60">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <input type="checkbox" checked={col.enabled} onChange={(e) => updCol(i, { enabled: e.target.checked })} className="w-4 h-4 accent-amber-600" title="Show this column" />
                <input className={`${input} flex-1 font-semibold`} value={col.heading} onChange={(e) => updCol(i, { heading: e.target.value })} placeholder="Column heading" />
                <button onClick={() => setCols(move(nav.footerColumns, i, i - 1))} disabled={i === 0} className={iconBtn} title="Move up">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => setCols(move(nav.footerColumns, i, i + 1))} disabled={i === nav.footerColumns.length - 1} className={iconBtn} title="Move down">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={() => setCols(nav.footerColumns.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Remove column">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <LinkListEditor links={col.links} onChange={(links) => updCol(i, { links })} />
            </div>
          ))}
        </div>
      </section>

      {/* Legal links */}
      <section>
        <h3 className={`${sectionTitle} mb-3`}>Legal links (bottom bar)</h3>
        <LinkListEditor links={nav.legalLinks} onChange={(legalLinks) => { setNav((n) => ({ ...n, legalLinks })); dirty(); }} />
      </section>

      {/* Footer blocks */}
      <section>
        <h3 className={`${sectionTitle} mb-3`}>Footer blocks</h3>
        <div className="space-y-2">
          {([
            ['showContact', 'Show the Contact block (email / phone / location)'],
            ['showSocial', 'Show social icons (fill URLs under Content → Footer)'],
            ['showNewsletter', 'Show the newsletter signup'],
          ] as [keyof NavigationContent, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={nav[key] as boolean}
                onChange={(e) => { setNav((n) => ({ ...n, [key]: e.target.checked })); dirty(); }}
                className="w-4 h-4 accent-amber-600"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-2 sticky bottom-0 bg-white/80 backdrop-blur py-3 -mx-1 px-1">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save navigation'}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
          <RotateCcw className="w-4 h-4" /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
