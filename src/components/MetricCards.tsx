"use client";

export type MetricItem = {
  label: string;
  value: string;
  hint: string;
  badge?: string;
  variant?: "red" | "gray" | "rose" | "neutral";
  icon?: "wallet" | "chart" | "alert" | "bolt";
};

function Icon({ type }: { type?: MetricItem["icon"] }) {
  const cls = "h-5 w-5";
  switch (type) {
    case "chart":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case "alert":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case "bolt":
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    default:
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
}

export function MetricCards({ items }: { items: MetricItem[] }) {
  const accentStyle = (variant: MetricItem["variant"]) => {
    switch (variant) {
      case "rose":
        return {
          glow: "rgba(244,63,94,0.15)",
          text: "text-orange-500",
          iconBg: "bg-crimson-500/10 text-crimson-400",
          border: "hover:border-crimson-500/30"
        };
      case "neutral":
        return {
          glow: "rgba(161,161,170,0.1)",
          text: "text-orange-500",
          iconBg: "bg-zinc-500/10 text-zinc-400",
          border: "hover:border-zinc-500/30"
        };
      case "gray":
        return {
          glow: "rgba(161,161,170,0.08)",
          text: "text-orange-500",
          iconBg: "bg-zinc-600/15 text-zinc-400",
          border: "hover:border-zinc-600/30"
        };
      case "red":
      default:
        return {
          glow: "rgba(244,63,94,0.18)",
          text: "text-orange-500",
          iconBg: "bg-crimson-500/10 text-crimson-400",
          border: "hover:border-crimson-500/30"
        };
    }
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const a = accentStyle(item.variant);
        return (
          <article
            key={item.label}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${a.border}`}
            style={{
  background: "rgba(255,255,255,0.10)",
  borderColor: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 10px 24px rgba(88, 56, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.14)"
}}
          >
            {/* Glow orb */}
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150"
              style={{ background: `radial-gradient(circle, ${a.glow} 0%, transparent 70%)` }}
            />

            <div className="relative flex items-start justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-500">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span>{item.badge}</span>
                )}
                <div className={`rounded-lg p-1.5 transition-colors duration-200 ${a.iconBg}`}>
                  <Icon type={item.icon} />
                </div>
              </div>
            </div>

            <p className={`relative mt-4 font-mono text-3xl font-bold tracking-tight ${a.text}`}>
              {item.value}
            </p>
            <p className="relative mt-1.5 text-xs text-500">{item.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
