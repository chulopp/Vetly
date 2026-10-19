import { GithubLogo } from '@phosphor-icons/react/dist/ssr';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-xs text-ink-500">
          Vetly &copy; 2026
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/chulopp/Vetly"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vetly on GitHub"
            className="text-ink-500 transition-colors hover:text-ink-100"
          >
            <GithubLogo className="size-4" weight="fill" />
          </a>
        </div>
      </div>
    </footer>
  );
}
