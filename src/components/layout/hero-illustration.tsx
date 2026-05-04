export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 500 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background card */}
      <rect x="40" y="20" width="420" height="280" rx="16" fill="white" stroke="#e4e4e7" strokeWidth="1.5" className="dark:fill-zinc-900 dark:stroke-zinc-700" />
      
      {/* Header bar */}
      <rect x="40" y="20" width="420" height="48" rx="16" fill="#f4f4f5" className="dark:fill-zinc-800" />
      <rect x="56" y="36" width="32" height="16" rx="4" fill="#3b82f6" />
      <rect x="96" y="38" width="80" height="8" rx="4" fill="#a1a1aa" />
      <rect x="96" y="50" width="120" height="4" rx="2" fill="#d4d4d8" />
      
      {/* Table header */}
      <rect x="56" y="80" width="388" height="28" rx="6" fill="#fafafa" className="dark:fill-zinc-800/50" />
      <rect x="68" y="88" width="40" height="12" rx="3" fill="#3b82f6" className="opacity-70" />
      <rect x="130" y="88" width="120" height="12" rx="3" fill="#3b82f6" className="opacity-70" />
      <rect x="270" y="88" width="80" height="12" rx="3" fill="#3b82f6" className="opacity-70" />
      <rect x="370" y="88" width="50" height="12" rx="3" fill="#3b82f6" className="opacity-70" />
      
      {/* Row 1 */}
      <rect x="56" y="116" width="388" height="32" rx="6" fill="white" className="dark:fill-zinc-900" />
      <rect x="68" y="126" width="24" height="12" rx="3" fill="#d4d4d8" />
      <rect x="130" y="126" width="100" height="12" rx="3" fill="#27272a" className="dark:fill-zinc-200" />
      <rect x="270" y="126" width="60" height="12" rx="3" fill="#a1a1aa" />
      <circle cx="385" cy="132" r="6" fill="#10b981" />
      
      {/* Row 2 */}
      <rect x="56" y="152" width="388" height="32" rx="6" fill="#fafafa" className="dark:fill-zinc-800/30" />
      <rect x="68" y="162" width="24" height="12" rx="3" fill="#d4d4d8" />
      <rect x="130" y="162" width="140" height="12" rx="3" fill="#27272a" className="dark:fill-zinc-200" />
      <rect x="270" y="162" width="55" height="12" rx="3" fill="#a1a1aa" />
      <circle cx="385" cy="168" r="6" fill="#f59e0b" />
      
      {/* Row 3 */}
      <rect x="56" y="188" width="388" height="32" rx="6" fill="white" className="dark:fill-zinc-900" />
      <rect x="68" y="198" width="24" height="12" rx="3" fill="#d4d4d8" />
      <rect x="130" y="198" width="90" height="12" rx="3" fill="#27272a" className="dark:fill-zinc-200" />
      <rect x="270" y="198" width="70" height="12" rx="3" fill="#a1a1aa" />
      <circle cx="385" cy="204" r="6" fill="#3b82f6" />
      
      {/* Row 4 */}
      <rect x="56" y="224" width="388" height="32" rx="6" fill="#fafafa" className="dark:fill-zinc-800/30" />
      <rect x="68" y="234" width="24" height="12" rx="3" fill="#d4d4d8" />
      <rect x="130" y="234" width="110" height="12" rx="3" fill="#27272a" className="dark:fill-zinc-200" />
      <rect x="270" y="234" width="50" height="12" rx="3" fill="#a1a1aa" />
      <circle cx="385" cy="240" r="6" fill="#10b981" />

      {/* Floating Kanban card */}
      <g className="translate-x-[340px] -translate-y-[20px]">
        <rect x="330" y="50" width="120" height="90" rx="10" fill="white" stroke="#e4e4e7" strokeWidth="1" className="dark:fill-zinc-800 dark:stroke-zinc-600" />
        <rect x="340" y="60" width="100" height="6" rx="3" fill="#3b82f6" />
        <rect x="340" y="72" width="80" height="4" rx="2" fill="#d4d4d8" />
        <rect x="340" y="82" width="70" height="4" rx="2" fill="#d4d4d8" />
        <rect x="340" y="94" width="50" height="6" rx="3" fill="#f59e0b" className="opacity-70" />
        <rect x="430" y="110" width="20" height="30" rx="6" fill="#3b82f6" className="opacity-20" />
      </g>
    </svg>
  );
}
