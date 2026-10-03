export function AuthDivider({ label = "Or continue with email" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[color:var(--card-border)]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-[color:var(--card)] px-2 text-[color:var(--muted)]">{label}</span>
      </div>
    </div>
  );
}
