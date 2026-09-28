import { Fragment, type ReactNode } from "react";
import { isolateNumbers } from "@/lib/i18n/terms";

/** Tiny, safe renderer for the subset of Markdown the assistant uses (paragraphs, "- " lists, **bold**, _italic_). */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1.5 space-y-1 ps-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[9px] size-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-1.5">
        {inline(para.join(" "))}
      </p>,
    );
    para = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else if (!line) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.replace(/^#+\s*/, ""));
    }
  }
  flushPara();
  flushList();
  return <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{blocks}</div>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2)
      return (
        <em key={i} className="text-[0.95em] opacity-75">
          {p.slice(1, -1)}
        </em>
      );
    // Keep numbers like 72% or 18°C in order inside right-to-left text.
    return <Fragment key={i}>{/[\u0600-\u06FF]/.test(s) ? isolateNumbers(p) : p}</Fragment>;
  });
}
