"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownClass =
  "docs-markdown space-y-4 text-[15px] leading-7 text-[color:var(--muted)] " +
  "[&_h1]:mb-4 [&_h1]:scroll-mt-24 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[color:var(--foreground)] " +
  "[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:border-b [&_h2]:border-[color:var(--card-border)] [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[color:var(--foreground)] " +
  "[&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[color:var(--foreground)] " +
  "[&_p]:leading-7 [&_strong]:font-semibold [&_strong]:text-[color:var(--foreground)] " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-[color:var(--muted)] " +
  "[&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-1 " +
  "[&_table]:w-full [&_table]:text-sm [&_th]:border [&_th]:border-[color:var(--card-border)] [&_th]:bg-[color:var(--card-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-[color:var(--card-border)] [&_td]:px-3 [&_td]:py-2 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--card-border)] [&_blockquote]:pl-4 [&_blockquote]:text-[color:var(--muted)] " +
  "[&_hr]:border-[color:var(--card-border)]";

type MarkdownBodyProps = {
  markdown: string;
};

export function MarkdownBody({ markdown }: MarkdownBodyProps) {
  return (
    <div className={markdownClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            if (href?.startsWith("/")) {
              return (
                <Link
                  href={href}
                  className="font-semibold text-[color:var(--accent)] underline-offset-2 hover:underline"
                  {...props}
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                className="font-semibold text-[color:var(--accent)] underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer noopener"
                {...props}
              >
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const inline = !className;
            if (inline) {
              return (
                <code
                  className="rounded-md bg-[color:var(--card-muted)] px-1.5 py-0.5 text-[0.9em] text-[color:var(--accent)]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return (
              <pre className="overflow-x-auto rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-muted)] p-4 text-sm leading-relaxed text-[color:var(--foreground)]">
                {children}
              </pre>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
