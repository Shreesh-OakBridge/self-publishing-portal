import { useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';

// Adds a `fontSize` attribute to the textStyle mark (TipTap has no built-in).
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: { fontSize?: string | null }) =>
              attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

const FONTS = ['Default', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
const SIZES = ['Default', '14px', '16px', '18px', '20px', '24px', '30px'];

interface Props {
  value: string;
  onChange: (html: string) => void;
  onText?: (text: string) => void;
}

export default function RichTextEditor({ value, onChange, onText }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      onText?.(editor.getText());
    },
  });

  // Sync external content changes (e.g. "import from file") without a loop.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
      onText?.(editor.getText());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-2 rounded hover:bg-gray-100 ${active ? 'bg-amber-100 text-amber-700' : 'text-gray-600'}`;

  const headingValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-gray-50 sticky top-16 z-10">
        {/* Block type */}
        <select
          value={headingValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          title="Text style"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        {/* Font family */}
        <select
          value={(editor.getAttributes('textStyle').fontFamily as string) || 'Default'}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'Default') editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(v).run();
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          title="Font"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Font size */}
        <select
          value={(editor.getAttributes('textStyle').fontSize as string) || 'Default'}
          onChange={(e) => {
            const v = e.target.value;
            editor
              .chain()
              .focus()
              .setMark('textStyle', { fontSize: v === 'Default' ? null : v })
              .run();
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          title="Font size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s === 'Default' ? 'Size' : s.replace('px', '')}
            </option>
          ))}
        </select>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </button>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Bulleted list">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Quote">
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Align left">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Align center">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Align right">
          <AlignRight className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btn(editor.isActive({ textAlign: 'justify' }))} title="Justify">
          <AlignJustify className="w-4 h-4" />
        </button>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Undo">
          <Undo className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="Redo">
          <Redo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className={btn(false)}
          title="Clear formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="px-6 py-4 min-h-[60vh] max-w-none [&_.ProseMirror]:min-h-[55vh] [&_.ProseMirror]:outline-none font-serif text-gray-800 leading-relaxed"
      />
    </div>
  );
}
