"use client";

export function LiquidGlass({
  children,
  style,
  className,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .lq-container {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          border: var(--glass-border, 0px solid rgba(255, 255, 255, 0.3));
          color: var(--container-text-color, #000000);
        }
        .lq-bend {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: 24px;
          overflow: hidden;
          pointer-events: none;
          backdrop-filter: blur(8px) saturate(180%);
          filter: url(#glass-blur);
          background: rgba(255, 255, 255, 1);
        }
        .lq-face {
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: 24px;
          box-shadow: 0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08);
          pointer-events: none;
          background: rgba(255, 255, 255, 1);
        }
        .lq-edge {
          display: none;
        }
      `}} />
      <div className={"lq-container" + (className ? " " + className : "")} style={style} onClick={onClick}>
        <div className="lq-bend" />
        <div className="lq-face" />
        <div className="lq-edge" />
        <div style={{ position: "relative", zIndex: 3 }}>{children}</div>
      </div>
    </>
  );
}
