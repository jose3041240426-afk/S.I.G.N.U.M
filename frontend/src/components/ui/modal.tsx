"use client";
import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.97)",
          color: "#000000",
          border: "var(--glass-border, 0px solid rgba(255,255,255,0.3))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #000000", opacity: 1, paddingBottom: title ? "0.75rem" : 0 }}
        >
          {title && (
            <h2 className="text-xl font-bold" style={{ color: "#000000", margin: 0 }}>
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-2xl font-bold"
            style={{ color: "#000000", opacity: 0.6, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
