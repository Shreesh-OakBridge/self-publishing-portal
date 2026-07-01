import { ChevronRight } from 'lucide-react';
import { withBase } from '../lib/basePath';

// Subtle visible breadcrumb for standalone subpages (Home › Page). Mirrors the
// BreadcrumbList JSON-LD emitted in seo.ts, so the structured data reflects
// on-page content (Google's preference for breadcrumb rich results).
export default function Breadcrumbs({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <ol className="flex items-center gap-1.5 text-sm text-gray-500">
        <li>
          <a href={withBase('/')} className="hover:text-amber-700 transition-colors">
            Home
          </a>
        </li>
        <li aria-hidden="true" className="text-gray-300">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>
        <li className="font-medium text-gray-700" aria-current="page">
          {label}
        </li>
      </ol>
    </nav>
  );
}
