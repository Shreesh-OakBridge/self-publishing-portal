import { Home, LayoutGrid, Rocket, ShoppingBag, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { go, stripBase } from '../lib/basePath';

// Pages where a bottom tab bar would get in the way (focused flows / admin).
const HIDDEN = ['/admin', '/checkout', '/login', '/signup', '/reset-password', '/quote'];

// Mobile-only bottom navigation tray for easy one-handed access. Adapts to
// auth state: shows quick links + an account badge when signed in, or
// Get Started / Log In when signed out.
export default function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  const path = stripBase(window.location.pathname);
  if (isAdmin || HIDDEN.includes(path)) return null;

  const firstName =
    (user?.user_metadata?.first_name as string) ||
    ((user?.user_metadata?.full_name as string) || '').split(' ')[0] ||
    '';
  const initial = (firstName || user?.email || '?').charAt(0).toUpperCase();
  const isHome = path === '' || path === '/';

  const Item = ({
    icon: Icon,
    label,
    onClick,
    active = false,
  }: {
    icon: typeof Home;
    label: string;
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${
        active ? 'text-amber-600' : 'text-gray-500'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Quick navigation"
    >
      <Item icon={Home} label="Home" onClick={() => go('/')} active={isHome} />
      <Item icon={LayoutGrid} label="Plans" onClick={() => go('/plans')} active={path === '/plans'} />
      {user ? (
        <>
          <Item
            icon={ShoppingBag}
            label="My Orders"
            onClick={() => go('/account')}
            active={path === '/account'}
          />
          <button
            onClick={() => go('/account')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${
              path === '/account' ? 'text-amber-600' : 'text-gray-500'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold flex items-center justify-center">
              {initial}
            </span>
            <span className="text-[10px] font-medium leading-none">
              {firstName ? `Hi, ${firstName}` : 'Account'}
            </span>
          </button>
        </>
      ) : (
        <>
          <Item icon={Rocket} label="Get Started" onClick={() => go('/get-started')} active={path === '/get-started'} />
          <Item icon={LogIn} label="Log In" onClick={() => go('/login')} active={path === '/login'} />
        </>
      )}
    </nav>
  );
}
