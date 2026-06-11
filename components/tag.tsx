import type { ReactNode } from "react";

export type TagTone = "neutral" | "primary" | "success" | "failure";

const tones: Record<TagTone, string> = {
  neutral: "bg-white/10 text-muted",
  primary: "bg-primary/15 text-primary-bright",
  success: "bg-success/15 text-success",
  failure: "bg-failure/15 text-failure",
};

// Small pill label for cuisine, status, and metadata rows.
export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: TagTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
