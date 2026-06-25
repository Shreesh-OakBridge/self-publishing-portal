import { useEffect, useState } from 'react';
import { LogOut, RefreshCw, Lock, Inbox, AlertCircle, FileText, Users, Activity, BookText, ShoppingBag, Tag, Library, LayoutTemplate, ShieldCheck, Menu, ClipboardList } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import { logActivity } from '../lib/activity';
import ContentEditor from './ContentEditor';
import AuthorsPanel from './AuthorsPanel';
import ActivityPanel from './ActivityPanel';
import ManuscriptsPanel from './ManuscriptsPanel';
import OrdersPanel from './OrdersPanel';
import QuotesPanel from './QuotesPanel';
import CouponsPanel from './CouponsPanel';
import BooksPanel from './BooksPanel';
import LayoutEditor from './LayoutEditor';
import AdminsPanel from './AdminsPanel';
import ExportMenu from './ExportMenu';
import type { Column } from '../lib/exporters';

// Tabs and which roles may see them. Editors are limited to leads + content.
const TABS = [
  { key: 'leads', label: 'Leads', Icon: Inbox, roles: ['owner', 'admin', 'editor'] },
  { key: 'manuscripts', label: 'Manuscripts', Icon: BookText, roles: ['owner', 'admin'] },
  { key: 'orders', label: 'Orders', Icon: ShoppingBag, roles: ['owner', 'admin'] },
  { key: 'quotes', label: 'Quotes', Icon: ClipboardList, roles: ['owner', 'admin'] },
  { key: 'authors', label: 'Authors', Icon: Users, roles: ['owner', 'admin'] },
  { key: 'books', label: 'Books', Icon: Library, roles: ['owner', 'admin'] },
  { key: 'promotions', label: 'Promotions', Icon: Tag, roles: ['owner', 'admin'] },
  { key: 'activity', label: 'Activity', Icon: Activity, roles: ['owner', 'admin'] },
  { key: 'layout', label: 'Layout', Icon: LayoutTemplate, roles: ['owner', 'admin', 'editor'] },
  { key: 'content', label: 'Site Content', Icon: FileText, roles: ['owner', 'admin', 'editor'] },
  { key: 'admins', label: 'Admins', Icon: ShieldCheck, roles: ['owner'] },
] as const;
import DateRangeFilter, { DateRange, emptyRange, filterByRange } from './DateRangeFilter';

const leadColumns: Column<Lead>[] = [
  { header: 'Date', value: (l) => new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
  { header: 'Name', value: (l) => l.full_name },
  { header: 'Email', value: (l) => l.email },
  { header: 'Phone', value: (l) => l.phone || '' },
  { header: 'Manuscript Title', value: (l) => l.manuscript_title || '' },
  { header: 'Genre', value: (l) => l.genre || '' },
  { header: 'Status', value: (l) => l.manuscript_status },
  { header: 'Preferred Plan', value: (l) => l.preferred_plan || '' },
  { header: 'Message', value: (l) => l.message || '' },
];

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  manuscript_title: string | null;
  genre: string | null;
  manuscript_status: string;
  preferred_plan: string | null;
  message: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [leadRange, setLeadRange] = useState<DateRange>(emptyRange);
  const [tab, setTab] = useState<'leads' | 'orders' | 'quotes' | 'manuscripts' | 'books' | 'authors' | 'promotions' | 'activity' | 'layout' | 'content' | 'admins'>('leads');
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = adminRole ?? 'admin';
  const filteredLeads = filterByRange(leads, leadRange, (l) => l.created_at);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    setLeadsError('');
    const { data, error } = await supabase
      .from('publishing_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setLeadsError('Could not load leads. Please try again.');
      console.error('Error loading leads:', error);
    } else {
      setLeads((data as Lead[]) ?? []);
    }
    setLoadingLeads(false);
  };

  // Verify the logged-in user is an admin (RLS also enforces this server-side).
  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      setAdminRole(null);
      return;
    }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
    supabase.rpc('admin_role').then(({ data }) => setAdminRole((data as string) ?? null));
  }, [session]);

  // If the current tab isn't allowed for this role, fall back to Leads.
  useEffect(() => {
    if (adminRole) {
      const allowed = (TABS.find((t) => t.key === tab)?.roles as readonly string[] | undefined)?.includes(adminRole);
      if (!allowed) setTab('leads');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminRole]);

  useEffect(() => {
    if (session && isAdmin) fetchLeads();
  }, [session, isAdmin]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('Invalid email or password.');
    } else {
      // Stamp + log the admin login (no-op for non-admins).
      const { data: ok } = await supabase.rpc('is_admin');
      if (ok) {
        await supabase.rpc('touch_admin_login');
        await logActivity('admin.login', {}, supabase);
      }
    }
    setSigningIn(false);
  };

  const handleSignOut = async () => {
    await logActivity('admin.logout', {}, supabase);
    await supabase.auth.signOut();
    setLeads([]);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4">
        <form
          onSubmit={handleSignIn}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-sm text-gray-500">Cursive leads dashboard</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-xl mb-4 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all mb-4"
            placeholder="admin@oakbridge.in"
          />

          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all mb-6"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // Logged in but still confirming admin status.
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Checking access…
      </div>
    );
  }

  // Logged in but not an admin — block access to the dashboard.
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not authorized</h1>
          <p className="text-gray-600 mb-6">
            This account doesn’t have admin access. Sign in with an admin account to manage leads and
            site content.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-700">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-gray-900">{activeTab?.label}</span>
        <button onClick={handleSignOut} className="text-gray-700">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-white border-r z-40 flex flex-col transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Cursive Admin</h1>
            <p className="text-xs text-gray-500 truncate">
              {session.user.email}
              {adminRole && <span className="block capitalize text-amber-700 font-semibold">{adminRole}</span>}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.filter((t) => (t.roles as readonly string[]).includes(role)).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <t.Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="md:ml-60">
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-20">
          <h2 className="text-lg font-bold text-gray-900">{activeTab?.label}</h2>
          {tab === 'leads' && (
            <button
              onClick={fetchLeads}
              disabled={loadingLeads}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLeads ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'content' ? (
          <ContentEditor />
        ) : tab === 'manuscripts' ? (
          <ManuscriptsPanel />
        ) : tab === 'orders' ? (
          <OrdersPanel />
        ) : tab === 'quotes' ? (
          <QuotesPanel />
        ) : tab === 'authors' ? (
          <AuthorsPanel />
        ) : tab === 'books' ? (
          <BooksPanel />
        ) : tab === 'promotions' ? (
          <CouponsPanel />
        ) : tab === 'activity' ? (
          <ActivityPanel />
        ) : tab === 'layout' ? (
          <LayoutEditor />
        ) : tab === 'admins' ? (
          <AdminsPanel isOwner={role === 'owner'} currentEmail={session?.user?.email ?? ''} />
        ) : (
        <>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="text-gray-600">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            {leadRange.from || leadRange.to ? ' in range' : ' total'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter range={leadRange} onChange={setLeadRange} />
            <ExportMenu baseName="leads" title="Leads" columns={leadColumns} rows={filteredLeads} />
          </div>
        </div>

        {leadsError && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{leadsError}</span>
          </div>
        )}

        {loadingLeads && leads.length === 0 ? (
          <div className="text-center text-gray-500 py-16">Loading leads…</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
            {leads.length === 0
              ? 'No leads yet. Submissions from the contact form will appear here.'
              : 'No leads in the selected date range.'}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Manuscript</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 align-top hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.full_name}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <a href={`mailto:${lead.email}`} className="text-amber-700 hover:underline">
                        {lead.email}
                      </a>
                      {lead.phone && <div className="text-gray-500">{lead.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.manuscript_title || <span className="text-gray-400">—</span>}
                      {lead.genre && <div className="text-gray-500">{lead.genre}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs capitalize">
                        {lead.manuscript_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.preferred_plan || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {lead.message || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
        </main>
      </div>
    </div>
  );
}
