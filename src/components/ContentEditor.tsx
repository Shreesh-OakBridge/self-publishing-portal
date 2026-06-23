import { useMemo, useState, useEffect } from 'react';
import { Save, RotateCcw, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { useContent } from '../content/ContentProvider';
import { defaultContent, SiteContent } from '../content/defaults';
import MediaUploadField from './MediaUploadField';

type Json = unknown;

const SECTION_LABELS: Record<string, string> = {
  branding: 'Logo & Branding',
  welcome: 'Welcome Screen (intro)',
  getStarted: 'Get Started (funnel)',
  hero: 'Hero / Banner',
  valueProps: 'Value Proposition',
  video: 'Process & Video',
  confidenceBar: 'Confidence Bar',
  services: 'Services',
  portfolio: 'Portfolio',
  testimonials: 'Testimonials',
  pricing: 'Pricing Plans',
  customizer: 'Book Customizer',
  manuscript: 'Manuscript Section',
  royaltyCalc: 'Royalty Calculator',
  editorial: 'Editorial Review',
  contact: 'Contact Section',
  faq: 'FAQ',
  pages: 'Static Pages (About / Terms / Privacy)',
  footer: 'Footer',
};

// Sections whose object keys should be edited one-at-a-time via sub-tabs
// (e.g. the Static Pages section → About / Terms / Privacy).
const SUBSECTIONS: Record<string, Record<string, string>> = {
  pages: { about: 'About Us', terms: 'Terms & Conditions', privacy: 'Privacy Policy' },
};

// Content fields that hold media — rendered as drag-and-drop uploaders.
const MEDIA_FIELDS: Record<string, { label: string; accept: 'image' | 'video' }> = {
  videoUrl: { label: 'Video', accept: 'video' },
  posterUrl: { label: 'Video Poster Image', accept: 'image' },
  imageUrl: { label: 'Hero Image', accept: 'image' },
  logoUrl: { label: 'Logo Image', accept: 'image' },
  coverUrl: { label: 'Book Cover Image', accept: 'image' },
};

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\b(\d+)\b/g, '$1')
    .trim();
}

// Build a blank template matching the shape of an existing item, so "Add"
// produces an empty entry with the right fields.
function blankFromTemplate(template: Json): Json {
  if (typeof template === 'string') return '';
  if (typeof template === 'number') return 0;
  if (typeof template === 'boolean') return false;
  if (Array.isArray(template)) return [];
  if (template && typeof template === 'object') {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(template)) out[k] = blankFromTemplate(v);
    return out;
  }
  return '';
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Json;
  onChange: (v: Json) => void;
}) {
  // Boolean -> checkbox
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center space-x-2 py-1">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-amber-600"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
    );
  }

  // String -> input or textarea
  if (typeof value === 'string') {
    const multiline = value.length > 70 || value.includes('\n');
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(6, Math.max(2, Math.ceil(value.length / 70)))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none resize-y"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
          />
        )}
      </div>
    );
  }

  // Number
  if (typeof value === 'number') {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
        />
      </div>
    );
  }

  // Array
  if (Array.isArray(value)) {
    const items = value as Json[];
    const addItem = () => {
      const template = items.length > 0 ? items[0] : '';
      onChange([...items, blankFromTemplate(template)]);
    };
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, v: Json) =>
      onChange(items.map((item, idx) => (idx === i ? v : item)));

    const itemsAreStrings = items.every((it) => typeof it === 'string');

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-gray-700">{label}</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-900 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        <div className={itemsAreStrings ? 'space-y-2' : 'space-y-3'}>
          {items.map((item, i) => (
            <div
              key={i}
              className={
                itemsAreStrings
                  ? 'flex items-start gap-2'
                  : 'border border-gray-200 rounded-xl p-3 bg-gray-50 relative'
              }
            >
              {itemsAreStrings ? (
                <>
                  <div className="flex-1">
                    <Field label={`${i + 1}`} value={item} onChange={(v) => updateItem(i, v)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="mt-5 text-gray-400 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      {label.replace(/s$/, '')} {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Field label="" value={item} onChange={(v) => updateItem(i, v)} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Object
  if (value && typeof value === 'object') {
    const obj = value as Record<string, Json>;
    return (
      <div className={label ? 'mb-4' : ''}>
        {label && <h4 className="text-sm font-bold text-gray-800 mb-2">{label}</h4>}
        <div className={label ? 'pl-3 border-l-2 border-amber-200 space-y-1' : 'space-y-1'}>
          {Object.entries(obj).map(([k, v]) => {
            const media = MEDIA_FIELDS[k];
            return media ? (
              <MediaUploadField
                key={k}
                label={media.label}
                accept={media.accept}
                value={typeof v === 'string' ? v : ''}
                onChange={(nv) => onChange({ ...obj, [k]: nv })}
              />
            ) : (
              <Field
                key={k}
                label={humanize(k)}
                value={v}
                onChange={(nv) => onChange({ ...obj, [k]: nv })}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default function ContentEditor() {
  const content = useContent();
  // `homeLayout` is managed in the dedicated Layout tab, not here.
  const sections = useMemo(
    () => (Object.keys(content) as (keyof SiteContent)[]).filter((k) => k !== 'homeLayout'),
    [content]
  );
  const [active, setActive] = useState<keyof SiteContent>(sections[0]);
  const [drafts, setDrafts] = useState<Record<string, Json>>(() => ({ ...content }));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const draft = drafts[active];

  // Sub-tab handling for sectioned editors (e.g. Static Pages).
  const subConfig = SUBSECTIONS[active as string];
  const subKeys = subConfig ? Object.keys(subConfig) : [];
  const [subKey, setSubKey] = useState<string>('');
  useEffect(() => {
    if (subConfig) {
      setSubKey((prev) => (prev && prev in subConfig ? prev : subKeys[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const setDraft = (v: Json) => {
    setDrafts((d) => ({ ...d, [active]: v }));
    setStatus(null);
  };

  const setSubDraft = (v: Json) => {
    const obj = (draft && typeof draft === 'object' ? draft : {}) as Record<string, Json>;
    setDraft({ ...obj, [subKey]: v });
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: active, value: draft, updated_at: new Date().toISOString() });
    if (error) {
      setStatus({ type: 'err', msg: 'Could not save. Please try again.' });
      console.error('Save error:', error);
    } else {
      setStatus({ type: 'ok', msg: 'Saved. Changes are live on the site.' });
    }
    setSaving(false);
  };

  const resetToDefault = () => {
    setDraft(JSON.parse(JSON.stringify(defaultContent[active])));
    setStatus({ type: 'ok', msg: 'Reset to default — remember to Save.' });
  };

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <nav className="space-y-1">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => {
              setActive(s);
              setStatus(null);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === s ? 'bg-amber-600 text-white' : 'text-gray-700 hover:bg-amber-50'
            }`}
          >
            {SECTION_LABELS[s] ?? humanize(s)}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {SECTION_LABELS[active] ?? humanize(active)}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefault}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save'}</span>
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-lg mb-4 text-sm ${
              status.type === 'ok'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
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

        {subConfig ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200 pb-3">
              {subKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => setSubKey(k)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    subKey === k
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {subConfig[k]}
                </button>
              ))}
            </div>
            {subKey && draft && typeof draft === 'object' && (
              <Field
                label=""
                value={(draft as Record<string, Json>)[subKey]}
                onChange={setSubDraft}
              />
            )}
          </>
        ) : (
          <Field label="" value={draft} onChange={setDraft} />
        )}
      </div>
    </div>
  );
}
