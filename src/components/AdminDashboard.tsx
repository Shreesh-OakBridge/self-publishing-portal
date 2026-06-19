import { useEffect, useState } from 'react';
import { LogOut, RefreshCw, Lock, Inbox, AlertCircle, FileText, Users, Activity, BookText, ShoppingBag, Tag, Library } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activity';
import ContentEditor from './ContentEditor';
import AuthorsPanel from './AuthorsPanel';
import ActivityPanel from './ActivityPanel';
import ManuscriptsPanel from './ManuscriptsPanel';
import OrdersPanel from './OrdersPanel';
import CouponsPanel from './CouponsPanel';
import BooksPanel from './BooksPanel';

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
  const [tab, setTab] = useState<'leads' | 'orders' | 'manuscripts' | 'books' | 'authors' | 'promotions' | 'activity' | 'content'>('leads');

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
      return;
    }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
  }, [session]);

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
    }
    setSigningIn(false);
  };

  const handleSignOut = async () => {
    await logActivity('auth.logout');
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
              <p className="text-sm text-gray-500">OakBridge leads dashboard</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OakBridge Admin</h1>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {tab === 'leads' && (
              <button
                onClick={fetchLeads}
                disabled={loadingLeads}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLeads ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex space-x-1">
          <button
            onClick={() => setTab('leads')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'leads'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Leads</span>
          </button>
          <button
            onClick={() => setTab('manuscripts')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'manuscripts'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookText className="w-4 h-4" />
            <span>Manuscripts</span>
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'orders'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setTab('authors')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'authors'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Authors</span>
          </button>
          <button
            onClick={() => setTab('books')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'books'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Books</span>
          </button>
          <button
            onClick={() => setTab('promotions')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'promotions'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promotions</span>
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'activity'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>
          <button
            onClick={() => setTab('content')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === 'content'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Site Content</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'content' ? (
          <ContentEditor />
        ) : tab === 'manuscripts' ? (
          <ManuscriptsPanel />
        ) : tab === 'orders' ? (
          <OrdersPanel />
        ) : tab === 'authors' ? (
          <AuthorsPanel />
        ) : tab === 'books' ? (
          <BooksPanel />
        ) : tab === 'promotions' ? (
          <CouponsPanel />
        ) : tab === 'activity' ? (
          <ActivityPanel />
        ) : (
        <>
        <p className="text-gray-600 mb-4">
          {leads.length} {leads.length === 1 ? 'lead' : 'leads'} total
        </p>

        {leadsError && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{leadsError}</span>
          </div>
        )}

        {loadingLeads && leads.length === 0 ? (
          <div className="text-center text-gray-500 py-16">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
            No leads yet. Submissions from the contact form will appear here.
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
                {leads.map((lead) => (
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
  );
}
