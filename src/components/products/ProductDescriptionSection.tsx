import React, { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  RotateCcw, 
  BadgeCheck, 
  FileText,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductDescriptionSectionProps {
  description: string;
  isHtml?: boolean;
}

export const ProductDescriptionSection: React.FC<ProductDescriptionSectionProps> = ({
  description,
  isHtml = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Clean unescaped text if needed
  const unescapedDesc = (description || "")
    .replace(/\\x3C/gi, "<")
    .replace(/\\x3E/gi, ">")
    .replace(/\\x22/gi, '"')
    .replace(/\\x27/gi, "'")
    .replace(/\\x2F/gi, "/")
    .replace(/\\x26/gi, "&")
    .replace(/\\x0A/gi, "\n")
    .replace(/\\x0D/gi, "\r")
    .replace(/\\"/g, '"');

  // Check if content is considered long enough to warrant a collapsible toggle
  const isContentLong = unescapedDesc.length > 380 || unescapedDesc.split("\n").length > 6;

  // Extract opening headline / quote hook (e.g. "পুরাতন আসবাবপত্রে নতুন রূপ এনে দিন – ...")
  let openingHook: string | null = null;
  let remainingPlainDesc = unescapedDesc;

  if (!isHtml) {
    const quoteMatch = unescapedDesc.match(/^\s*["“]([^"”]+)["”]/);
    if (quoteMatch && quoteMatch[1] && quoteMatch[1].length > 10) {
      openingHook = quoteMatch[1].trim();
      remainingPlainDesc = unescapedDesc.replace(/^\s*["“][^"”]+["”]\s*/, "").trim();
    }
  }

  // Format plain text lines with bullet/highlight detection
  const renderFormattedPlainText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check if line is a bullet or highlighted feature
      const isBullet = /^[👉⭐✔✅•\-\*]/.test(trimmed);
      const isHeading = trimmed.endsWith(":") || trimmed.includes("–") || trimmed.includes("ক্যাটাগরি:") || /^(কেন |ব্যবহার |বৈশিষ্ট্য|উপকারিতা)/i.test(trimmed);

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 py-0.5 group">
            <span className="text-amber-500 font-bold shrink-0 select-none mt-0.5">
              {trimmed.startsWith("👉") ? "👉" : trimmed.startsWith("⭐") ? "⭐" : trimmed.startsWith("✔") || trimmed.startsWith("✅") ? "✔" : "•"}
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {trimmed.replace(/^[👉⭐✔✅•\-\*]\s*/, "")}
            </span>
          </div>
        );
      }

      if (isHeading) {
        return (
          <div key={idx} className="pt-2 pb-1">
            <span className="inline-block font-bold text-foreground text-sm sm:text-base border-b-2 border-amber-500/40 pb-0.5">
              {trimmed}
            </span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-slate-800 dark:text-slate-200 text-sm sm:text-[15px] leading-relaxed font-normal">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <section 
      aria-label="Product Description"
      className="relative mt-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-primary/[0.03] to-card p-4 sm:p-6 shadow-lg shadow-amber-500/10 dark:shadow-amber-500/5 ring-1 ring-amber-500/20 overflow-hidden transition-all duration-300 w-full max-w-full"
    >
      {/* Top glowing ambient accent ribbon */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-orange-500" />
      
      {/* Subtle corner light flare */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-amber-500/20 dark:border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-primary to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight flex items-center gap-1.5">
                Description
                <span className="text-primary font-bold text-sm sm:text-base">/ পণ্যের বিবরণ</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-500" />
                হাইলাইটস
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              পণ্যটি অর্ডার করার আগে প্রয়োজনীয় তথ্য দেখে নিন
            </p>
          </div>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ১০০% অরিজিনাল ও অথেনটিক
        </div>
      </div>

      {/* Featured Headline / Hook Card if available */}
      {openingHook && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/5 border-l-4 border-amber-500 dark:border-amber-400 shadow-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-2xl leading-none text-amber-500 select-none font-serif shrink-0">“</span>
            <p className="text-amber-950 dark:text-amber-100 font-bold text-sm sm:text-base leading-snug">
              {openingHook}
            </p>
            <span className="text-2xl leading-none text-amber-500 select-none font-serif shrink-0">”</span>
          </div>
        </div>
      )}

      {/* Description Content Container */}
      <div 
        className={cn(
          "relative transition-all duration-300 bg-card/90 dark:bg-slate-900/40 backdrop-blur-xs rounded-xl p-4 sm:p-5 border border-border/80 shadow-xs",
          isContentLong && !isExpanded ? "max-h-72 overflow-hidden" : "max-h-none"
        )}
      >
        {isHtml ? (
          <div
            className="product-description-content text-slate-800 dark:text-slate-100 text-sm sm:text-[15px] leading-relaxed font-normal prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden w-full
              [&_h1]:text-foreground [&_h1]:font-bold [&_h1]:text-base [&_h1]:sm:text-lg [&_h1]:mb-2
              [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-sm [&_h2]:sm:text-base [&_h2]:mb-2
              [&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mb-1.5
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_img]:shadow-sm
              [&_table]:w-full [&_table]:max-w-full [&_table]:table-auto [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto [&_table]:my-3
              [&_td]:border [&_td]:border-border [&_td]:p-2.5 [&_td]:break-words [&_td]:text-xs [&_td]:sm:text-sm
              [&_th]:border [&_th]:border-border [&_th]:p-2.5 [&_th]:break-words [&_th]:bg-muted/50 [&_th]:text-foreground [&_th]:font-bold [&_th]:text-xs [&_th]:sm:text-sm
              [&_a]:text-primary [&_a]:underline [&_a]:font-medium [&_a]:break-all
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
              [&_p]:break-words [&_p]:max-w-full [&_p]:mb-2.5 [&_div]:max-w-full [&_span]:max-w-full"
            dangerouslySetInnerHTML={{
              __html: unescapedDesc
                .replace(/&nbsp;/gi, " ")
                .replace(/width\s*:\s*\d{3,}px/gi, "width: 100%")
                .replace(/min-width\s*:\s*\d{3,}px/gi, "min-width: 0px")
                .replace(/width="[0-9]{3,}"/gi, 'width="100%"'),
            }}
          />
        ) : (
          <div className="space-y-1">
            {renderFormattedPlainText(remainingPlainDesc.replace(/&nbsp;/gi, " "))}
          </div>
        )}

        {/* Gradient fade overlay when collapsed */}
        {isContentLong && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card dark:from-slate-900 via-card/85 dark:via-slate-900/85 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand / Collapse Button */}
      {isContentLong && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full px-5 py-1.5 text-xs sm:text-sm font-bold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-200 hover:border-amber-500/60 shadow-xs transition-all flex items-center gap-1.5"
          >
            {isExpanded ? (
              <>
                <span>সংক্ষেপে দেখুন (Show Less)</span>
                <ChevronUp className="w-4 h-4 text-amber-500" />
              </>
            ) : (
              <>
                <span>সম্পূর্ণ বিবরণ পড়ুন (Read More)</span>
                <ChevronDown className="w-4 h-4 text-amber-500 animate-bounce" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Trust & Guarantee highlights strip */}
      <div className="mt-4 pt-3.5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Truck className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground">সারা দেশে দ্রুত হোম ডেলিভারি</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-medium text-foreground">৭ দিনের সহজ রিটার্ন পলিসি</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-medium text-foreground">নিরাপদ ক্যাশ অন ডেলিভারি</span>
        </div>
      </div>
    </section>
  );
};
