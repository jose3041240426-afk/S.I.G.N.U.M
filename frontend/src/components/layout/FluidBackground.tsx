export function FluidBackground() {
  return (
    <div
      className="fixed inset-0 h-full w-full"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        background: "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-primary-rgb, 59, 130, 246)) 50%, #080816 50%) 0%, color-mix(in srgb, rgb(var(--color-primary-rgb, 59, 130, 246)) 75%, #080816 25%) 30%, rgb(var(--color-primary-rgb, 59, 130, 246)) 50%, color-mix(in srgb, rgb(var(--color-primary-rgb, 59, 130, 246)) 75%, #080816 25%) 70%, color-mix(in srgb, rgb(var(--color-primary-rgb, 59, 130, 246)) 50%, #080816 50%) 100%)",
      }}
    />
  );
}
