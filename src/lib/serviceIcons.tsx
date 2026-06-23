// Shared registry of icons that can be assigned to a Service card.
// Used by the public Services page (to render the chosen icon) and by the
// admin Content editor (to render a visual icon picker).
import {
  PenTool, Palette, LayoutGrid, ShieldCheck, Globe, Megaphone, BookOpen,
  Feather, Edit3, FileText, Type, Image, BadgeCheck, Award, Truck, Send,
  BarChart3, TrendingUp, Users, Star, Sparkles, Bookmark, Library, Newspaper,
  Mic, Camera, Tag, ScrollText, Heart, Lightbulb, Search, type LucideIcon,
} from 'lucide-react';

// Order here = order shown in the admin picker grid.
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  PenTool, Feather, Edit3, Type, ScrollText, FileText, Newspaper,
  Palette, Image, Camera, LayoutGrid,
  BookOpen, Bookmark, Library,
  ShieldCheck, BadgeCheck, Award,
  Globe, Truck, Send,
  Megaphone, Mic, Tag, Search,
  BarChart3, TrendingUp, Users, Star, Sparkles, Heart, Lightbulb,
};

export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS);

// Fallback rotation so older items without an explicit icon still look distinct.
const FALLBACK = [PenTool, Palette, LayoutGrid, ShieldCheck, Globe, Megaphone, BookOpen];

// Resolve an icon by name, falling back to a position-based default.
export function resolveServiceIcon(name: string | undefined, index = 0): LucideIcon {
  if (name && SERVICE_ICONS[name]) return SERVICE_ICONS[name];
  return FALLBACK[index % FALLBACK.length];
}
