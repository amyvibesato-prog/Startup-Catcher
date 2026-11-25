export function DesktopBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0c1015]"
    >
      {/* Subtle architectural dark slate planes inspired by the Windows 11 desktop mockup */}
      <div
        className="absolute -left-[6%] top-0 h-[52%] w-[24%]"
        style={{
          background: 'linear-gradient(155deg, #1b222b 0%, #12171e 100%)',
          boxShadow: '18px 24px 48px rgba(0, 0, 0, 0.55)',
        }}
      />
      <div
        className="absolute left-[14%] -top-[4%] h-[56%] w-[28%]"
        style={{
          background: 'linear-gradient(160deg, #27303b 0%, #192028 100%)',
          boxShadow: '20px 26px 56px rgba(0, 0, 0, 0.52)',
        }}
      />
      <div
        className="absolute left-[36%] top-0 h-[54%] w-[32%]"
        style={{
          background: 'linear-gradient(145deg, #323d4a 0%, #202832 100%)',
          boxShadow: '24px 28px 64px rgba(0, 0, 0, 0.48)',
        }}
      />
      <div
        className="absolute right-0 -top-[4%] h-[55%] w-[36%]"
        style={{
          background: 'linear-gradient(150deg, #2a3440 0%, #1a212a 100%)',
          boxShadow: '-16px 24px 52px rgba(0, 0, 0, 0.5)',
        }}
      />
      <div
        className="absolute left-0 top-[50%] h-[54%] w-[32%]"
        style={{
          background: 'linear-gradient(165deg, #202831 0%, #12171d 100%)',
          boxShadow: '20px -12px 48px rgba(0, 0, 0, 0.45)',
        }}
      />
      <div
        className="absolute left-[29%] top-[48%] h-[56%] w-[38%]"
        style={{
          background: 'linear-gradient(165deg, #171e26 0%, #0e1319 100%)',
          boxShadow: '0 -14px 50px rgba(0, 0, 0, 0.52)',
        }}
      />
      <div
        className="absolute right-0 top-[46%] h-[58%] w-[37%]"
        style={{
          background: 'linear-gradient(155deg, #242e39 0%, #141a21 100%)',
          boxShadow: '-18px -10px 54px rgba(0, 0, 0, 0.5)',
        }}
      />
      {/* Gentle radial vignette to keep focus anchored at the center utility window */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 70% at 50% 48%, rgba(255,255,255,0.03) 0%, rgba(7,10,14,0.48) 100%)',
        }}
      />
    </div>
  );
}
