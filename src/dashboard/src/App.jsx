import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const STOCKS = [
  ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "NVIDIA"], ["AMZN", "Amazon"],
  ["META", "Meta"], ["GOOGL", "Alphabet"], ["JPM", "JPMorgan"], ["XOM", "Exxon Mobil"],
  ["JNJ", "Johnson & Johnson"], ["WMT", "Walmart"],
];
const COLORS = ["#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#fb7185", "#fb923c", "#facc15", "#4ade80", "#2dd4bf", "#22d3ee"];
const FALLBACK_SIGNALS = [
  { text: "Technology sector reports strong quarterly earnings growth", sentiment: 0.72, sentiment_label: "positive", event_type: "Corporate Earnings", impact_score: 7 },
  { text: "Central bank signals steady path for interest rates", sentiment: 0.02, sentiment_label: "neutral", event_type: "Monetary Policy", impact_score: 5 },
  { text: "Global markets assess renewed geopolitical tensions", sentiment: -0.68, sentiment_label: "negative", event_type: "Geopolitical", impact_score: 9 },
];

function normalize(values) {
  const total = values.reduce((sum, item) => sum + item.rawWeight, 0);
  return values.map((item) => ({ ...item, weight: Number(((item.rawWeight / total) * 100).toFixed(2)) }));
}

function App() {
  const [signals, setSignals] = useState(FALLBACK_SIGNALS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connected, setConnected] = useState(false);

  const loadSignals = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/news`);
      if (!response.ok) throw new Error(`News request failed (${response.status})`);
      const articles = await response.json();
      const liveSignals = articles.map((article) => article.signal);
      if (liveSignals.length) setSignals(liveSignals);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    loadSignals();
    const timer = window.setInterval(loadSignals, 30000);
    return () => window.clearInterval(timer);
  }, [loadSignals]);

  const portfolio = useMemo(() => normalize(STOCKS.map(([ticker, name], index) => {
    const signal = signals[index % signals.length];
    return { ticker, name, rawWeight: Math.max(1, 10 + signal.sentiment * 5), sentiment: signal.sentiment };
  })), [signals]);

  const averageSentiment = signals.reduce((sum, signal) => sum + signal.sentiment, 0) / signals.length;
  const averageImpact = signals.reduce((sum, signal) => sum + signal.impact_score, 0) / signals.length;

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">S&amp;P 100 tactical intelligence</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">FinRisk<span className="text-cyan-400">-AI</span></h1>
            <p className="mt-2 text-slate-400">Module A / Sentiment-driven index rebalancer</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
            {connected ? "Live risk engine" : "Synthetic fallback"} · updated {lastUpdated.toLocaleTimeString()}
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Portfolio sentiment" value={`${averageSentiment >= 0 ? "+" : ""}${averageSentiment.toFixed(2)}`} tone={averageSentiment >= 0 ? "text-emerald-400" : "text-rose-400"} />
          <Metric label="Average impact score" value={`${averageImpact.toFixed(1)} / 10`} tone="text-amber-300" />
          <Metric label="Tracked constituents" value="10 stocks" tone="text-cyan-300" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.5fr]">
          <div className="panel flex min-h-[440px] flex-col">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold">Tactical allocation</h2><p className="text-sm text-slate-500">Weights normalized to 100%</p></div>
              <span className="rounded bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-300">REAL-TIME</span>
            </div>
            <div className="relative flex flex-1 items-center justify-center">
              <ResponsiveContainer width="100%" height={330}>
                <PieChart><Pie data={portfolio} dataKey="weight" nameKey="ticker" innerRadius={92} outerRadius={132} paddingAngle={3}>
                  {portfolio.map((entry, index) => <Cell key={entry.ticker} fill={COLORS[index]} />)}
                </Pie><Tooltip contentStyle={{ background: "#0f1c2e", border: "1px solid #334155", borderRadius: 8 }} formatter={(value) => [`${value}%`, "Weight"]} /></PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute text-center"><p className="text-3xl font-bold">100%</p><p className="text-xs uppercase tracking-wider text-slate-500">allocated</p></div>
            </div>
          </div>

          <div className="panel">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Live news intelligence</h2><p className="text-sm text-slate-500">Signals driving the rebalance</p></div><span className="text-xs text-slate-500">30s polling</span></div>
            <div className="space-y-3">{signals.map((signal, index) => <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-4" key={`${signal.text}-${index}`}>
              <div className="mb-2 flex items-start justify-between gap-3"><p className="text-sm leading-5 text-slate-200">{signal.text}</p><span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${signal.sentiment >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{signal.sentiment >= 0 ? "+" : ""}{signal.sentiment.toFixed(2)}</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="rounded bg-slate-800 px-2 py-1 text-slate-400">{signal.event_type}</span><span className="text-amber-300">Impact {signal.impact_score}/10</span></div>
            </article>)}</div>
          </div>
        </section>

        <section className="panel mt-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Constituent weights</h2><p className="text-xs text-slate-500">Positive news increases exposure · negative news reduces exposure</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{portfolio.map((stock, index) => <div className="rounded-lg border border-slate-800 p-3" key={stock.ticker}><div className="flex justify-between"><span className="font-semibold">{stock.ticker}</span><span className="font-mono text-cyan-300">{stock.weight}%</span></div><p className="mt-1 text-xs text-slate-500">{stock.name}</p><div className="mt-3 h-1.5 rounded-full bg-slate-800"><div className="h-1.5 rounded-full" style={{ width: `${Math.min(stock.weight * 5, 100)}%`, backgroundColor: COLORS[index] }} /></div></div>)}</div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }) {
  return <div className="panel"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></div>;
}

export default App;
