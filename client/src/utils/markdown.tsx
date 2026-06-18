import React from "react";

/**
 * Parses basic markdown syntax (bold, unordered list items, ordered list items)
 * and returns it as a React node tree.
 */
export function parseMarkdown(text: string): React.ReactNode {
  const lines = text.replace(/\r/g, "").split("\n");
  
  return lines.map((line, index) => {
    // Process inline bolding (**text**)
    const renderInline = (str: string) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={partIdx} className="font-semibold text-black dark:text-cream">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    // Unordered list item (* or -)
    const ulMatch = line.match(/^(\s*)[*\-]\s+(.*)$/);
    if (ulMatch) {
      return (
        <div key={index} className="flex gap-2 items-start pl-3 my-0.5">
          <span className="text-forest dark:text-cream select-none mt-1 text-[8px]">•</span>
          <span className="flex-1 text-black/85 dark:text-cream/90">
            {renderInline(ulMatch[2])}
          </span>
        </div>
      );
    }

    // Ordered list item (1. or 2. etc.)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      return (
        <div key={index} className="flex gap-2 items-start pl-3 my-0.5">
          <span className="text-forest dark:text-cream font-medium select-none text-xs mt-0.5">
            {olMatch[2]}.
          </span>
          <span className="flex-1 text-black/85 dark:text-cream/90">
            {renderInline(olMatch[3])}
          </span>
        </div>
      );
    }

    // Regular paragraph / text line
    return (
      <div key={index} className={line.trim() === "" ? "h-2" : "my-0.5"}>
        {renderInline(line)}
      </div>
    );
  });
}
