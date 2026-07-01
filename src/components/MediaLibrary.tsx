import { useEffect, useState } from 'react';
import {
  UploadCloud, Trash2, Copy, Check, Download, RefreshCw, FileVideo, Image as ImageIcon, Loader2, FileDown,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';

const BUCKET = 'site-media';

interface MediaItem {
  name: string;
  folder: 'images' | 'videos';
  url: string;
  size: number | null;
}

const kb = (n: number | null) => (n ? `${Math.round(n / 1024)} KB` : '');

// Reusable media library over the site-media bucket.
// - Default (manage) mode: upload / delete / copy / download / export.
// - Picker mode (pass onSelect): click a tile to choose its URL.
export default function MediaLibrary({
  accept = 'all',
  onSelect,
}: {
  accept?: 'image' | 'video' | 'all';
  onSelect?: (url: string) => void;
}) {
  const picker = !!onSelect;
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  const folders: ('images' | 'videos')[] =
    accept === 'image' ? ['images'] : accept === 'video' ? ['videos'] : ['images', 'videos'];

  const load = async () => {
    setLoading(true);
    setError('');
    const all: MediaItem[] = [];
    for (const folder of folders) {
      const { data, error: err } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
      if (err) {
        setError('Could not load media. Make sure the site-media bucket exists.');
        continue;
      }
      (data ?? []).forEach((f) => {
        if (f.name === '.emptyFolderPlaceholder') return;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`);
        all.push({
          name: f.name,
          folder,
          url: pub.publicUrl,
          size: (f.metadata?.size as number) ?? null,
        });
      });
    }
    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) continue;
      if (accept === 'image' && !isImage) continue;
      if (accept === 'video' && !isVideo) continue;
      const folder = isVideo ? 'videos' : 'images';
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${Date.now()}-${safe}`;
      const { error: err } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (err) setError(`Upload failed for ${file.name}: ${err.message}`);
    }
    setUploading(false);
    load();
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone, and any section using it will break.`)) return;
    const { error: err } = await supabase.storage.from(BUCKET).remove([`${item.folder}/${item.name}`]);
    if (err) {
      setError('Could not delete: ' + err.message);
      return;
    }
    load();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const exportCsv = () => {
    const rows = [['Name', 'Type', 'URL', 'Size (bytes)']].concat(
      items.map((i) => [i.name, i.folder === 'videos' ? 'video' : 'image', i.url, String(i.size ?? '')]),
    );
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cursive-media-manifest.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-gray-600 text-sm">
          {items.length} {items.length === 1 ? 'asset' : 'assets'}
          {picker ? ' — click one to select' : ''}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Import / Upload'}
            <input
              type="file"
              multiple
              accept={accept === 'video' ? 'video/*' : accept === 'image' ? 'image/*' : 'image/*,video/*'}
              className="hidden"
              disabled={uploading}
              onChange={(e) => uploadFiles(e.target.files)}
            />
          </label>
          {!picker && (
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              <FileDown className="w-4 h-4" /> Export list
            </button>
          )}
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading media…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          No media yet. Use “Import / Upload” to add images or videos.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={`${item.folder}/${item.name}`}
              className={`bg-white border rounded-xl overflow-hidden group ${picker ? 'cursor-pointer hover:border-amber-400 hover:shadow' : ''}`}
              onClick={picker ? () => onSelect!(item.url) : undefined}
            >
              <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                {item.folder === 'images' ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
                ) : (
                  <FileVideo className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate" title={item.name}>{item.name}</p>
                <p className="text-[10px] text-gray-400 mb-1">{kb(item.size)}</p>
                {!picker && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <button onClick={() => copy(item.url)} title="Copy URL" className="hover:text-amber-700">
                      {copied === item.url ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={item.url} download={item.name} target="_blank" rel="noopener noreferrer" title="Download" className="hover:text-amber-700">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => remove(item)} title="Delete" className="ml-auto hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!picker && (
        <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> Files live in the “site-media” storage bucket. “Export list” downloads a
          CSV of every asset’s URL.
        </p>
      )}
    </div>
  );
}
