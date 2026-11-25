// A few line icons (lucide-style paths), so the video needs no icon package.
const base = (size: number, color: string, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconX = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></>);

export const IconPhoneMissed = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <>
    <path d="m16 2 6 6" /><path d="m22 2-6 6" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </>);

export const IconReturn = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" /></>);

export const IconBag = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>);

export const IconMessage = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />);

export const IconCheck = ({ size = 56, color = "currentColor" }) =>
  base(size, color, <path d="M20 6 9 17l-5-5" />);
