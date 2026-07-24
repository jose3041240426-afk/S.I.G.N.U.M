"use client";
import { useState } from "react";

interface MenuDrawerProps {
  children?: React.ReactNode;
}

export function MenuDrawer({ children }: MenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        button {
          border: none;
          background: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          font-family: inherit;
        }
        .menu-bg {
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.1);
          background: var(--menu-bg, rgba(255, 255, 255, 0.85));
          box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(12px);
          width: 65px;
          height: 65px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .menu__icon {
          width: 32px;
          height: 32px;
          padding: 4px;
        }
        .menu__icon span {
          display: block;
          width: 100%;
          height: 0.125rem;
          border-radius: 2px;
          background-color: rgb(var(--color-primary-rgb, 0, 122, 255));
          box-shadow: 0 .5px 2px 0 hsla(0, 0%, 0%, .2);
          transition: background-color .4s;
          position: relative;
        }
        .menu__icon span+span {
          margin-top: .375rem;
        }
        .menu__icon span:nth-child(1) {
          animation: ease .8s menu-icon-top-2 forwards;
        }
        .menu__icon span:nth-child(2) {
          animation: ease .8s menu-icon-scaled-2 forwards;
        }
        .menu__icon span:nth-child(3) {
          animation: ease .8s menu-icon-bottom-2 forwards;
        }
        .menu__icon:hover span:nth-child(1) {
          animation: ease .8s menu-icon-top forwards;
        }
        .menu__icon:hover span:nth-child(2) {
          animation: ease .8s menu-icon-scaled forwards;
        }
        .menu__icon:hover span:nth-child(3) {
          animation: ease .8s menu-icon-bottom forwards;
          background-color: rgb(255, 59, 48);
        }
        @keyframes menu-icon-top {
          0% { top: 0; transform: rotate(0); }
          50% { top: .5rem; transform: rotate(0); }
          100% { top: .5rem; transform: rotate(45deg); }
        }
        @keyframes menu-icon-top-2 {
          0% { top: .5rem; transform: rotate(45deg); }
          50% { top: .5rem; transform: rotate(0); }
          100% { top: 0; transform: rotate(0); }
        }
        @keyframes menu-icon-bottom {
          0% { bottom: 0; transform: rotate(0); }
          50% { bottom: .5rem; transform: rotate(0); }
          100% { bottom: .5rem; transform: rotate(135deg); }
        }
        @keyframes menu-icon-bottom-2 {
          0% { bottom: .5rem; transform: rotate(135deg); }
          50% { bottom: .5rem; transform: rotate(0); }
          100% { bottom: 0; transform: rotate(0); }
        }
        @keyframes menu-icon-scaled {
          50% { transform: scale(0); }
          100% { transform: scale(0); }
        }
        @keyframes menu-icon-scaled-2 {
          0% { transform: scale(0); }
          50% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .drawer-panel {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 9999;
          width: min(90vw, 380px);
          background: rgba(20, 22, 30, 0.95);
          backdrop-filter: blur(24px) saturate(180%);
          border-right: 1px solid rgba(255,255,255,0.1);
          padding: 24px;
          overflow-y: auto;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          color: #ffffff;
        }
        .drawer-panel.open {
          transform: translateX(0);
        }

        .drawer-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.08);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: background 0.2s;
        }
        .drawer-close:hover {
          background: rgba(255,255,255,0.15);
        }
      `}} />

      <div className="menu-bg">
        <button className="menu__icon" onClick={() => setIsOpen(true)}>
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={"drawer-overlay" + (isOpen ? " open" : "")}
        onClick={() => setIsOpen(false)}
      />

      <div className={"drawer-panel" + (isOpen ? " open" : "")}>
        <button className="drawer-close" onClick={() => setIsOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </>
  );
}
