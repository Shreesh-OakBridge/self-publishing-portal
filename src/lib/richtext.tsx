import { ReactNode } from 'react';

// Minimal, XSS-safe markdown-ish renderer (returns React nodes — never injects
// raw HTML). Supports: # ## ### headings, - / * bullet lists, blank-line
// paragraphs, **bold**, *italic*, and [text](url) links.

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyBase}-i${i}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      const href = m[5];
      const external = /^https?:\/\//i.test(href);
      const safe = external || href.startsWith('/');
      nodes.push(
        safe ? (
          <a
            key={`${keyBase}-a${i}`}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-amber-700 underline hover:text-amber-900"
          >
            {m[4]}
          </a>
        ) : (
          m[4]
        ),
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderMarkdown(body: string): ReactNode {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push(
        <h3 key={key} className="text-lg font-bold text-gray-900 mt-6 mb-2">
          {inline(line.replace(/^###\s+/, ''), `h${key}`)}
        </h3>,
      );
      key++;
      i++;
      continue;
    }
    if (/^#{1,2}\s+/.test(line)) {
      blocks.push(
        <h2 key={key} className="text-2xl font-bold text-gray-900 mt-8 mb-3">
          {inline(line.replace(/^#{1,2}\s+/, ''), `h${key}`)}
        </h2>,
      );
      key++;
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key} className="list-disc pl-6 space-y-1 my-3 text-gray-700 leading-relaxed">
          {items.map((it, j) => (
            <li key={j}>{inline(it, `li${key}-${j}`)}</li>
          ))}
        </ul>,
      );
      key++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key} className="text-gray-700 leading-relaxed my-3">
        {inline(para.join(' '), `p${key}`)}
      </p>,
    );
    key++;
  }
  return <>{blocks}</>;
}
