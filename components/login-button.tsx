import { BirdMark } from "./bird-mark";

// "Sign in with Blackbird" — white bird on black, per the brand rule (the
// bird never sits on purple). Point href at the server route that starts the
// OAuth handshake; this is a full-page navigation, so it renders as an anchor.
export function LoginButton({
  href,
  label = "Sign in with Blackbird",
  disabled = false,
  className = "",
}: {
  href: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const base = `inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-strong bg-black px-6 font-semibold text-white transition duration-150 ease-standard ${className}`;

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed opacity-40`}>
        <BirdMark size={18} />
        {label}
      </span>
    );
  }

  return (
    <a href={href} className={`${base} hover:bg-surface-high`}>
      <BirdMark size={18} />
      {label}
    </a>
  );
}
