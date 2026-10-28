import { Lock, Phone } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 pb-24 pt-5 text-xs text-stone-600 sm:pb-5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
        <p>© {new Date().getFullYear()} প্যারামাউন্ট রয়েল ফুডস</p>
        <div className="flex items-center gap-4">
          <a
            href="tel:01798241344"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-800"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>01798-241344</span>
          </a>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 transition-colors hover:text-emerald-800"
            >
              <Lock className="h-3 w-3" />
              <span>অ্যাডমিন</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
