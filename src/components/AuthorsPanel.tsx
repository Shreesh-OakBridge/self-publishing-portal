import { useEffect, useState } from 'react';
import { RefreshCw, Palette, Calculator, AlertCircle, BookUser } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';
import { SearchBox, SortControl } from './AdminControls';
import { filterBySearch, sortRows, noSort, type SortState } from '../lib/adminFilter';
import { useContent } from '../content/ContentProvider';
import { normalizeQuestions, describeAnswers } from '../lib/customizerQuestions';

interface Author {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  book_scope: string | null;
  created_at: string;
}
interface Cust {
  id: string;
  user_id: string | null;
  created_at: string;
  paper_type: string | null;
  book_size: string | null;
  binding: string | null;
  interior_color: string | null;
  estimated_price: number | null;
  questionnaire_answers: Record<string, string> | null;
}
interface Calc {
  id: string;
  user_id: string | null;
  created_at: string;
  plan_type: string | null;
  book_price: number | null;
  expected_sales: number | null;
  monthly_earnings: number | null;
}

const inr = (n: number | null | undefined) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AuthorsPanel() {
  const { customizer } = useContent();
  const questionnaireQuestions = normalizeQuestions(customizer.questions);
  const [expandedCustId, setExpandedCustId] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [custs, setCusts] = useState<Cust[]>([]);
  const [calcs, setCalcs] = useState<Calc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<DateRange>(emptyRange);

  const load = async () => {
    setLoading(true);
    setError('');
    const [a, c, r] = await Promise.all([
      supabase.rpc('admin_authors'),
      supabase.from('book_customizations').select('*').order('created_at', { ascending: false }),
      supabase.from('royalty_calculations').select('*').order('created_at', { ascending: false }),
    ]);
    if (a.error || c.error || r.error) {
      console.error(a.error, c.error, r.error);
      setError('Could not load authors. Make sure the latest SQL has been run.');
    } else {
      setAuthors((a.data as Author[]) ?? []);
      setCusts((c.data as Cust[]) ?? []);
      setCalcs((r.data as Calc[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>(noSort);

  const columns: Column<Author>[] = [
    { header: 'Name', value: (a) => a.full_name || '' },
    { header: 'Email', value: (a) => a.email || '' },
    { header: 'Phone', value: (a) => a.phone || '' },
    { header: 'Bio', value: (a) => a.bio || '' },
    { header: 'Book Scope', value: (a) => a.book_scope || '' },
    { header: 'Joined', value: (a) => fmt(a.created_at) },
    { header: 'Customizations', value: (a) => custs.filter((x) => x.user_id === a.id).length },
    { header: 'Royalty Projections', value: (a) => calcs.filter((x) => x.user_id === a.id).length },
  ];

  const filtered = sortRows(
    filterBySearch(
      filterByRange(authors, range, (a) => a.created_at),
      columns,
      search,
      (a) => `${a.id}`,
    ),
    columns,
    sort,
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-16">Loading authors…</div>;
  }
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'author' : 'authors'}
          {(range.from || range.to) && <span className="text-gray-400"> in range</span>}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBox value={search} onChange={setSearch} placeholder="Search user ID, email, name…" />
          <SortControl columns={columns} sort={sort} onChange={setSort} />
          <DateRangeFilter range={range} onChange={setRange} />
          <ExportMenu baseName="authors" title="Authors" columns={columns} rows={filtered} />
          <button
            onClick={load}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          {authors.length === 0 ? 'No authors have signed up yet.' : 'No authors in the selected date range.'}
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((au) => {
            const ac = custs.filter((x) => x.user_id === au.id);
            const ar = calcs.filter((x) => x.user_id === au.id);
            return (
              <div key={au.id} className="bg-white rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <BookUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {au.full_name || '(no name set)'}
                      </h3>
                      {au.email ? (
                        <a href={`mailto:${au.email}`} className="text-sm text-amber-700 hover:underline">
                          {au.email}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 italic">no email yet</span>
                      )}
                      {au.phone && (
                        <div>
                          <a href={`tel:${au.phone}`} className="text-sm text-gray-600 hover:underline">
                            {au.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Joined {fmt(au.created_at)}</span>
                </div>

                {(au.bio || au.book_scope) && (
                  <div className="mt-3 text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                    {au.bio && (
                      <p>
                        <span className="font-semibold text-gray-700">About: </span>
                        <span className="text-gray-600">{au.bio}</span>
                      </p>
                    )}
                    {au.book_scope && (
                      <p>
                        <span className="font-semibold text-gray-700">Book: </span>
                        <span className="text-gray-600">{au.book_scope}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-2">
                      <Palette className="w-4 h-4" /> Customizations ({ac.length})
                    </p>
                    {ac.length === 0 ? (
                      <p className="text-xs text-gray-400">None saved.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {ac.map((c) => {
                          const answers = describeAnswers(questionnaireQuestions, c.questionnaire_answers);
                          const expanded = expandedCustId === c.id;
                          return (
                            <li key={c.id} className="text-gray-700">
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  {fmt(c.created_at)} — {c.book_size || '—'}, {c.binding || '—'},{' '}
                                  {c.interior_color || '—'} ·{' '}
                                  <span className="font-semibold">{inr(c.estimated_price)}</span>
                                </span>
                                {answers.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedCustId(expanded ? null : c.id)}
                                    className="text-xs text-amber-700 font-semibold hover:underline flex-shrink-0"
                                  >
                                    {expanded ? 'Hide answers' : `Answers (${answers.length})`}
                                  </button>
                                )}
                              </div>
                              {expanded && (
                                <ul className="mt-1.5 ml-3 space-y-1 text-xs bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                  {answers.map((a, i) => (
                                    <li key={i}>
                                      <span className="text-gray-500">{a.question}</span>{' '}
                                      <span className="font-semibold text-gray-900">— {a.answer}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-2">
                      <Calculator className="w-4 h-4" /> Royalty projections ({ar.length})
                    </p>
                    {ar.length === 0 ? (
                      <p className="text-xs text-gray-400">None saved.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {ar.map((r) => (
                          <li key={r.id} className="text-gray-700">
                            {fmt(r.created_at)} — {r.plan_type || '—'}, {inr(r.book_price)} ×{' '}
                            {r.expected_sales ?? 0}/mo · <span className="font-semibold">{inr(r.monthly_earnings)}/mo</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
