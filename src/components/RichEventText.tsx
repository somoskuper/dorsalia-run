import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const pattern = /(<br\s*\/?>|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/gi;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (/^<br\s*\/?>$/i.test(part)) return <br key={index} />;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">{link[1]}</a>;
    return part;
  });
}

export default function RichEventText({ value, collapsed = false }: { value: string; collapsed?: boolean }) {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] | null = null;
  const flushParagraph = () => { if (paragraph.length) { blocks.push(<p key={`p-${blocks.length}`} className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{inline(paragraph.join("\n"))}</p>); paragraph = []; } };
  const flushList = () => { if (!list) return; const Tag = list.ordered ? "ol" : "ul"; blocks.push(<Tag key={`l-${blocks.length}`} className={`${list.ordered ? "list-decimal" : "list-disc"} max-w-full space-y-1 break-words pl-6 [overflow-wrap:anywhere]`}>{list.items.map((item, i) => <li key={i} className="min-w-0 max-w-full">{inline(item)}</li>)}</Tag>); list = null; };
  const flushTable = () => { if (!table?.length) { table = null; return; } const [head, ...body] = table; blocks.push(<div key={`t-${blocks.length}`} className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-white/15"><table className="w-max min-w-full max-w-none border-collapse text-left text-[15px]"><thead className="bg-white/10"><tr>{head.map((cell, i) => <th key={i} className="max-w-[260px] break-words border-b border-white/15 px-3 py-2 font-semibold text-white [overflow-wrap:anywhere]">{inline(cell)}</th>)}</tr></thead><tbody>{body.map((row, r) => <tr key={r} className="border-b border-white/10 last:border-0">{head.map((_, c) => <td key={c} className="max-w-[260px] break-words px-3 py-2 align-top text-white/85 [overflow-wrap:anywhere]">{inline(row[c] || "")}</td>)}</tr>)}</tbody></table></div>); table = null; };
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const raw = lines[lineIndex];
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const tableCells = /^\s*\|.*\|\s*$/.test(line) ? line.trim().slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|")) : null;
    const nextIsSeparator = Boolean(lines[lineIndex + 1]?.trim().match(/^\|(?:\s*:?-{3,}:?\s*\|)+$/));
    if (tableCells && (table || nextIsSeparator)) { flushParagraph(); flushList(); if (!table) table = []; table.push(tableCells); if (nextIsSeparator) lineIndex += 1; continue; }
    flushTable();
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (heading) { flushParagraph(); flushList(); const Tag = heading[1].length === 1 ? "h3" : "h4"; blocks.push(<Tag key={`h-${blocks.length}`} className="font-semibold text-white">{inline(heading[2])}</Tag>); continue; }
    if (bullet || ordered) { flushParagraph(); const isOrdered = Boolean(ordered); if (!list || list.ordered !== isOrdered) { flushList(); list = { ordered: isOrdered, items: [] }; } list.items.push((bullet || ordered)![1]); continue; }
    if (line.startsWith("> ")) { flushParagraph(); flushList(); blocks.push(<blockquote key={`q-${blocks.length}`} className="border-l-2 border-[#c9f24b] pl-4 text-white/70">{inline(line.slice(2))}</blockquote>); continue; }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList(); flushTable();
  return <div className={`w-full min-w-0 max-w-full overflow-hidden break-words text-[clamp(1rem,4.5vw,1.125rem)] leading-relaxed text-white/90 [overflow-wrap:anywhere] [&_a]:break-all [&_code]:break-all [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto ${collapsed ? "line-clamp-4" : "space-y-4"}`}>{blocks}</div>;
}
