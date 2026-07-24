"use client";

export function NavButton({ children, onClick, icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-btn {
          position: relative;
          font-family: inherit;
          font-weight: 500;
          font-size: 18px;
          letter-spacing: 0.05em;
          border-radius: 0.8em;
          cursor: pointer;
          border: none;
          background: #ffffff;
          overflow: hidden;
          width: 100%;
        }
        .nav-btn svg {
          width: 1.2em;
          height: 1.2em;
          margin-right: 0.5em;
        }
        .nav-btn span {
          position: relative;
          z-index: 10;
          transition: color 0.4s;
          display: inline-flex;
          align-items: center;
          padding: 0.8em 1.2em 0.8em 1.05em;
          justify-content: center;
          color: #000000;
        }
        .nav-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -10%;
          width: 120%;
          height: 100%;
          z-index: 0;
          background: linear-gradient(to right, color-mix(in srgb, rgb(var(--color-primary-rgb, 15, 58, 115)), #000 25%), color-mix(in srgb, rgb(var(--color-primary-rgb, 37, 99, 235)), #000 25%));
          transform: translateX(-100%);
          transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .nav-btn:hover::before {
          transform: translateX(0);
        }
        .nav-btn:hover span {
          color: var(--color-primary-text, #000000);
        }
        .nav-btn:active {
          transform: scale(0.95);
        }
      `}} />
      <button className="nav-btn" onClick={onClick}>
        <span>{icon}{children}</span>
      </button>
    </>
  );
}
