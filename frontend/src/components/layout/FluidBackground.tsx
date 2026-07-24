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
        background: "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-primary-rgb, 10, 22, 40)) 15%, #000 85%) 0%, color-mix(in srgb, rgb(var(--color-primary-rgb, 15, 43, 74)) 35%, #000 65%) 25%, rgb(var(--color-primary-rgb, 26, 74, 122)) 50%, color-mix(in srgb, rgb(var(--color-primary-rgb, 15, 43, 74)) 35%, #000 65%) 75%, color-mix(in srgb, rgb(var(--color-primary-rgb, 10, 22, 40)) 15%, #000 85%) 100%)",
      }}
    />
  );
}
