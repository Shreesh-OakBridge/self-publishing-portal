import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, X, Images } from 'lucide-react';
import { supabaseAdmin as supabase } from '../lib/supabaseAdmin';
import MediaLibrary from './MediaLibrary';

const BUCKET = 'site-media';

type Accept = 'image' | 'video' | 'audio';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  accept: Accept;
  // Optional alt text (SEO/accessibility) for image fields.
  alt?: string;
  onAltChange?: (v: string) => void;
}

// Reusable admin media field: drag-and-drop an image or video (uploaded to
// Supabase Storage) OR paste a URL. Used for every media field in the CMS.
export default function MediaUploadField({ value, onChange, label, accept, alt, onAltChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const acceptAttr = accept === 'video' ? 'video/*' : accept === 'audio' ? 'audio/*' : 'image/*';
  const folder = accept === 'video' ? 'videos' : accept === 'audio' ? 'audio' : 'images';
  const hint =
    accept === 'video'
      ? 'MP4, WebM or MOV. Keep files reasonably small.'
      : accept === 'audio'
      ? 'MP3, WAV or OGG. Keep it short (a 1–2s brand sound is ideal).'
      : 'PNG, JPG, SVG or WebP.';

  const upload = async (file: File) => {
    if (!file.type.startsWith(`${accept}/`)) {
      setStatus({ type: 'err', msg: `Please choose a ${accept} file.` });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      setStatus({ type: 'ok', msg: 'Uploaded. Remember to Save the section.' });
    } catch (err) {
      console.error('Media upload failed:', err);
      setStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>

      {/* Preview of current media */}
      {value && (
        <div className="relative mb-2 inline-block">
          {accept === 'video' ? (
            <video src={value} className="max-h-32 rounded-lg border" muted />
          ) : accept === 'audio' ? (
            <audio src={value} controls className="max-w-full" />
          ) : (
            <img src={value} alt="preview" className="max-h-32 rounded-lg border object-contain" />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove media"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
          dragOver ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 mx-auto text-amber-600 mb-2 animate-spin" />
        ) : (
          <UploadCloud className="w-7 h-7 mx-auto text-amber-600 mb-2" />
        )}
        <p className="text-sm text-gray-600">Drag &amp; drop a {accept} here, or</p>
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <label className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-amber-700">
            {uploading ? 'Uploading…' : 'Choose file'}
            <input
              type="file"
              accept={acceptAttr}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-600 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-50"
          >
            <Images className="w-4 h-4" /> Choose from gallery
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{hint}</p>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Media gallery</h3>
              <button onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaLibrary
              accept={accept}
              onSelect={(url) => {
                onChange(url);
                setStatus({ type: 'ok', msg: 'Selected from gallery. Remember to Save the section.' });
                setPickerOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {status && (
        <div
          className={`flex items-center space-x-2 mt-2 text-sm ${
            status.type === 'ok' ? 'text-green-700' : 'text-red-700'
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

      <div className="mt-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Or paste a {accept} URL{accept === 'video' ? ' (YouTube/Vimeo embed or direct file)' : ''}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={accept === 'video' ? 'https://…/video.mp4' : accept === 'audio' ? 'https://…/sound.mp3' : 'https://…/image.png'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
        />
      </div>

      {/* Alt text — improves SEO and accessibility for images. */}
      {accept === 'image' && onAltChange && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Alt text <span className="font-normal text-gray-400">(describe the image — for SEO &amp; screen readers)</span>
          </label>
          <input
            type="text"
            value={alt ?? ''}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="e.g. Book cover of ‘The Good Divorce’ by Sarita Salwan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
          />
        </div>
      )}
    </div>
  );
}
