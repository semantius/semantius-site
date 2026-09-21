import { useEffect } from 'react';

export default function SignUpModal({ open, onClose, waitlistKey = '' }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="overlay-fade-in fixed inset-0 z-[9998] bg-black/55 backdrop-blur-[4px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign up"
          className="overlay-scale-in pointer-events-auto w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-background rounded-2xl shadow-2xl"
        >
          <div className="p-6">
            {/* embed.js (preloaded in <head>) watches document.body via MutationObserver
                and injects its iframe as soon as this div appears in the DOM */}
            <div
              className="waitlister-form"
              data-waitlist-key={waitlistKey}
              data-height="410px"
            />
          </div>
        </div>
      </div>
    </>
  );
}
