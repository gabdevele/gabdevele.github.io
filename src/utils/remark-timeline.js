import { visit } from "unist-util-visit";

/**
 * Remark plugin that transforms fenced code blocks with the `timeline` language
 * into a styled vertical timeline.
 *
 * Syntax:
 * ```timeline
 * 2026-01-25 | Vulnerability discovered and reported.
 * 2026-02-01 | Patch merged.
 * 2026-03-02 | CVE assigned.
 * ```
 *
 * Each line must follow the pattern: `<date> | <description>`
 * Lines that don't match are silently ignored.
 */
export function remarkTimeline() {
  return tree => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "timeline") return;

      const items = node.value
        .split("\n")
        .map(line => {
          const sep = line.indexOf("|");
          if (sep === -1) return null;
          return { date: line.slice(0, sep).trim(), label: line.slice(sep + 1).trim() };
        })
        .filter(Boolean);

      if (!items.length) return;

      const dots = items
        .map(
          ({ date, label }) => `
  <div class="relative">
    <div class="absolute size-3 rounded-full bg-accent ring-4 ring-background" style="inset-inline-start:-39px;top:4px;"></div>
    <time class="text-sm font-semibold text-accent">${date}</time>
    <p class="mt-1 text-sm text-foreground/80">${label}</p>
  </div>`
        )
        .join("");

      parent.children.splice(index, 1, {
        type: "html",
        value: `<div class="not-prose my-6 border-s-2 border-border ps-8 space-y-8">${dots}\n</div>`,
      });
    });
  };
}