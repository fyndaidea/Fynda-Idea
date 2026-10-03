export default function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[color:var(--background)]"
    >
      <div
        className="absolute -top-[30%] left-1/2 h-[min(90vw,640px)] w-[min(100vw,800px)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255, 200, 180, 0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[20%] -right-[10%] h-[min(50vw,400px)] w-[min(50vw,400px)] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255, 220, 210, 0.25) 0%, transparent 72%)",
        }}
      />
    </div>
  );
}
