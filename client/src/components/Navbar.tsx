import { TbSun, TbMoon } from "react-icons/tb";

interface NavbarProps {
  onNewChat: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ onNewChat, isDark, onToggleDark }: Readonly<NavbarProps>) {
  return (
    <nav
      id="main-navbar"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 px-2 py-2 rounded-full
        shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]
        dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
        border border-black/6 dark:border-white/8"
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)"
          : "linear-gradient(135deg, rgba(235,225,207,0.55) 0%, rgba(235,225,207,0.35) 100%)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        minWidth: "min(540px, 92vw)",
      }}
    >
      {/* Brand */}
      <div className="flex items-baseline gap-1.5 pl-5">
        <h1 className="font-display text-xl font-semibold tracking-wide text-forest dark:text-cream m-0">
          Lumé
        </h1>
        <span className="font-body text-[11px] font-light tracking-[0.2em] uppercase text-gold-dim dark:text-gold-light">
          Support
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle"
          onClick={onToggleDark}
          className="w-9 h-9 rounded-full flex items-center justify-center
            border-none cursor-pointer transition-all duration-300
            bg-black/5 dark:bg-white/8
            hover:bg-black/10 dark:hover:bg-white/[0.14]
            active:scale-90"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <TbSun className="text-gold-light text-base" />
          ) : (
            <TbMoon className="text-forest text-base" />
          )}
        </button>

        {/* New Chat */}
        <button
          id="new-chat-button"
          onClick={onNewChat}
          className="flex items-center gap-2 px-5 py-2 rounded-full font-body text-sm font-medium tracking-wide
            bg-forest text-white cursor-pointer
            transition-all duration-300 ease-out border-none
            hover:bg-forest-light hover:shadow-[0_4px_16px_rgba(10,72,52,0.25)]
            active:scale-95"
        >
          New Chat
        </button>
      </div>
    </nav>
  );
}