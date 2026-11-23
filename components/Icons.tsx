type P = React.SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconClock = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconChurch = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 2.5v4M10.3 4.3h3.4" /><path d="M6 21V11l6-4.5 6 4.5v10" /><path d="M3.5 21h17" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" /></svg>);
export const IconGlass = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 3.5h12l-6 8z" /><path d="M12 11.5V20M8.5 20.5h7" /><path d="M8 6.2h8" /></svg>);
export const IconDinner = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="13" r="6" /><circle cx="12" cy="13" r="3.2" /><path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 9v11M21 4c-1.8 0-2.5 2-2.5 5h2.5v11" /></svg>);
export const IconLayers = (p: P) => (<svg viewBox="0 0 48 48" {...base} {...p}><path d="M24 8 6 17l18 9 18-9z" /><path d="m6 24 18 9 18-9" /><path d="m6 31 18 9 18-9" /></svg>);
export const IconRings = (p: P) => (<svg viewBox="0 0 48 48" {...base} {...p}><circle cx="18" cy="29" r="11" /><circle cx="30" cy="29" r="11" /><path d="m26 10 4-4 4 4-4 5z" /></svg>);
export const IconPin = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconChevron = (p: P) => (<svg viewBox="0 0 16 10" {...base} {...p}><path d="m1.5 1.5 6.5 6.5 6.5-6.5" /></svg>);
export const IconCheck = (p: P) => (<svg viewBox="0 0 16 16" {...base} {...p}><path d="m2.5 8.5 3.5 3.5 7.5-8" /></svg>);
export const IconX = (p: P) => (<svg viewBox="0 0 16 16" {...base} {...p}><path d="m3 3 10 10M13 3 3 13" /></svg>);
export const IconArrow = (p: P) => (<svg viewBox="0 0 16 16" width="16" height="16" {...base} {...p}><path d="M2 8h12M9.5 3.5 14 8l-4.5 4.5" /></svg>);
export const IconUp = (p: P) => (<svg viewBox="0 0 16 16" width="16" height="16" {...base} {...p}><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>);
export const IconCalendar = (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
export const IconCopy = (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>);
export const IconMusic = (p: P) => (<svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3a9 9 0 0 1 9 9" /></svg>);
export const IconHeart = (p: { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={p.size ?? 28} height={p.size ?? 28} fill="currentColor" className={p.className}><path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.8 12 21 12 21z" /></svg>
);

export const scheduleIcons = { clock: IconClock, church: IconChurch, glass: IconGlass, dinner: IconDinner };
