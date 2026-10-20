import { GithubLogo } from '@phosphor-icons/react/dist/ssr';

export default function Footer() {
  return (
    <footer className="w-full bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vetly-full.png"
            alt="Vetly"
            className="h-4 w-auto opacity-70 transition-opacity hover:opacity-100"
          />
          <span className="text-xs text-ink-500">&copy; 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/chulopp/Vetly"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vetly on GitHub"
            className="flex size-8 items-center justify-center rounded-full bg-white/[0.08] text-ink-400 transition-all hover:bg-white/15 hover:text-white"
          >
            <GithubLogo className="size-4" weight="fill" />
          </a>
        </div>
      </div>
    </footer>
  );
}
