import { useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { useContent } from '../content/ContentProvider';
import { defaultContent, HOME_SECTIONS, HomeLayoutSection } from '../content/defaults';

const labelFor = (key: string) => HOME_SECTIONS.find((s) => s.key === key)?.label ?? key;

// Merge a saved order with the known section list: keep saved order, drop
// unknown keys, append any known sections that aren't in the saved order.
function reconcile(saved: HomeLayoutSection[]): HomeLayoutSection[] {
  const seen = new Set<string>();
  const list: HomeLayoutSection[] = [];
  for (const s of saved) {
    if (HOME_SECTIONS.some((h) => h.key === s.key) && !seen.has(s.key)) {
      list.push({ key: s.key, enabled: s.enabled !== false });
      seen.add(s.key);
    }
  }
  for (const h of HOME_SECTIONS) {
    if (!seen.has(h.key)) list.push({ key: h.key, enabled: true });
  }
  return list;
}

type View = 'guest' | 'member';

export default function LayoutEditor() {
  const { homeLayout } = useContent();
  const [view, setView] = useState<View>('guest');
  const [guestItems, setGuestItems] = useState<HomeLayoutSection[]>(() => reconcile(homeLayout.sections));
  const [memberItems, setMemberItems] = useState<HomeLayoutSection[]>(() =>
    reconcile(homeLayout.loggedInSections?.length ? homeLayout.loggedInSections : homeLayout.sections),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const items = view === 'guest' ? guestItems : memberItems;
  const setItems = view === 'guest' ? setGuestItems : setMemberItems;

  const dirty = () => setStatus(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
    dirty();
  };

  const toggle = (i: number) => {
    setItems((prev) => prev.map((s, idx) => (idx === i ? { ...s, enabled: !s.enabled } : s)));
    dirty();
  };

  const onDrop = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    move(dragIndex, target);
    setDragIndex(null);
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from('site_content').upsert({
      key: 'homeLayout',
      value: { sections: guestItems, loggedInSections: memberItems },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      console.error(error);
      setStatus({ type: 'err', msg: 'Could not save layout. Please try again.' });
    } else {
      setStatus({ type: 'ok', msg: 'Both layouts saved. Refresh the homepage to see the new order.' });
    }
  };

  const reset = () => {
    const def = reconcile(
      view === 'guest' ? defaultContent.homeLayout.sections : defaultContent.homeLayout.loggedInSections,
    );
    setItems(def);
    setStatus({ type: 'ok', msg: 'Reset this layout to default — remember to Save.' });
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="max-w-2xl">
      {/* Audience tabs */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => { setView('guest'); setStatus(null); }} className={tabCls(view === 'guest')}>
          Logged-out visitors
        </button>
        <button onClick={() => { setView('member'); setStatus(null); }} className={tabCls(view === 'member')}>
          Logged-in members
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        You’re editing the <strong>{view === 'guest' ? 'logged-out (visitor)' : 'logged-in (member)'}</strong> homepage.
        Drag rows (or use the arrows) to reorder, and toggle the eye to show/hide. The header and footer stay fixed.
        Note: logged-in members see their personal dashboard in place of the hero — every other section appears or hides
        exactly as you set it here for this audience.
      </p>

      {status && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg mb-4 text-sm ${
            status.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {status.type === 'ok' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((s, i) => (
          <li
            key={s.key}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => setDragIndex(null)}
            className={`flex items-center gap-3 bg-white border rounded-xl px-3 py-2.5 transition-shadow ${
              dragIndex === i ? 'opacity-50' : ''
            } ${s.enabled ? '' : 'opacity-60'}`}
          >
            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
            <span className="flex-1 font-medium text-gray-900">
              {labelFor(s.key)}
              {!s.enabled && <span className="ml-2 text-xs text-gray-400">(hidden)</span>}
            </span>

            <button
              onClick={() => toggle(i)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              title={s.enabled ? 'Hide section' : 'Show section'}
            >
              {s.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => move(i, i + 1)}
              disabled={i === items.length - 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving…' : 'Save layout'}</span>
        </button>
        <button
          onClick={reset}
          className="flex items-center space-x-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset this layout</span>
        </button>
      </div>
    </div>
  );
}
