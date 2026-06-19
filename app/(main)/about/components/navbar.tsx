import Link from "next/link";

const NAV_LINKS = [
  { label: "Our Story", href: "#our-story" },
  { label: "Why Hiffi Exists", href: "#why-hiffi-exists" },
  { label: "How Hiffi Works", href: "#how-hiffi-works" },
] as const;

function HiffiLogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="5" stroke="#FF2D3D" strokeWidth="2" />
      <path
        d="M7 7V19H10V13H16V19H19V7H16V11H10V7H7Z"
        fill="#FF2D3D"
      />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="mx-auto mt-[25px] flex w-full max-w-[836px] items-center justify-between md:w-[85%]">
      <Link href="/" className="flex items-center gap-2">
        <HiffiLogoMark />
        <span className="text-[15px] font-extrabold uppercase tracking-[-0.02em] text-[#FF2D3D]">
          HIFFI
        </span>
      </Link>

      <nav className="hidden items-center gap-[50px] md:flex" aria-label="About page">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs font-medium text-[#111111] transition-colors hover:text-[#FF2D3D]"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <Link
        href="/signup"
        className="inline-flex h-9 w-[70px] items-center justify-center rounded-full bg-[#FF2D3D] text-xs font-semibold text-white transition-colors hover:bg-[#E82635]"
      >
        Sign Up
      </Link>
    </header>
  );
}
