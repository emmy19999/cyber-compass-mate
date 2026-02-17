import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FluidBackground } from "@/components/FluidBackground";
import { AssistantChat } from "@/components/AssistantChat";
import { BarChart3, Shield, Activity, TrendingUp, AlertTriangle, Clock, Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend,
} from "recharts";

interface ScanRow {
  id: string;
  target: string;
  risk_score: number | null;
  severity_summary: string | null;
  full_report: string;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "hsl(0, 72%, 51%)",
  High: "hsl(25, 95%, 53%)",
  Medium: "hsl(38, 92%, 50%)",
  Low: "hsl(142, 76%, 45%)",
  Info: "hsl(186, 100%, 50%)",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setScans((data as ScanRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [user]);

  // Derived analytics
  const totalScans = scans.length;
  const avgRisk = totalScans
    ? Math.round(scans.reduce((s, r) => s + (r.risk_score ?? 0), 0) / totalScans)
    : 0;
  const highRiskCount = scans.filter((s) => (s.risk_score ?? 0) >= 70).length;

  // Risk distribution for pie chart
  const riskBuckets = [
    { name: "Low (0-25)", value: scans.filter((s) => (s.risk_score ?? 0) <= 25).length, color: SEVERITY_COLORS.Low },
    { name: "Medium (26-50)", value: scans.filter((s) => { const r = s.risk_score ?? 0; return r > 25 && r <= 50; }).length, color: SEVERITY_COLORS.Medium },
    { name: "High (51-75)", value: scans.filter((s) => { const r = s.risk_score ?? 0; return r > 50 && r <= 75; }).length, color: SEVERITY_COLORS.High },
    { name: "Critical (76-100)", value: scans.filter((s) => (s.risk_score ?? 0) > 75).length, color: SEVERITY_COLORS.Critical },
  ].filter((b) => b.value > 0);

  // Scan timeline (last 30 days)
  const timelineData = (() => {
    const days: Record<string, number> = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    scans.forEach((s) => {
      const day = s.created_at.slice(0, 10);
      if (day in days) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      scans: count,
    }));
  })();

  // Severity frequency from reports
  const severityCounts = (() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    scans.forEach((s) => {
      const text = s.full_report.toLowerCase();
      if (text.includes("critical")) counts.Critical++;
      if (text.includes("high")) counts.High++;
      if (text.includes("medium")) counts.Medium++;
      if (text.includes("low")) counts.Low++;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, fill: SEVERITY_COLORS[name] }))
      .filter((c) => c.value > 0);
  })();

  // Top targets
  const topTargets = (() => {
    const freq: Record<string, number> = {};
    scans.forEach((s) => { freq[s.target] = (freq[s.target] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([target, count]) => ({ target, count }));
  })();

  return (
    <div className="min-h-screen relative">
      <FluidBackground />
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground font-mono">Scan intelligence overview</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="border-border"
            style={{ backdropFilter: "blur(8px)", background: "hsl(var(--card) / 0.6)" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scanner
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20 font-mono">Loading analytics...</div>
        ) : totalScans === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Scan Data Yet</h2>
            <p className="text-muted-foreground mb-4">Run your first security scan to see analytics here.</p>
            <Button onClick={() => navigate("/")}>Go to Scanner</Button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Target className="w-5 h-5" />} label="Total Scans" value={totalScans} />
              <StatCard icon={<Activity className="w-5 h-5" />} label="Avg Risk Score" value={`${avgRisk}/100`} />
              <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="High Risk Targets" value={highRiskCount} />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Last Scan" value={scans[0] ? new Date(scans[0].created_at).toLocaleDateString() : "N/A"} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Risk Distribution Pie */}
              <ChartCard title="Risk Distribution">
                {riskBuckets.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={riskBuckets} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {riskBuckets.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              {/* Severity Frequency Bar */}
              <ChartCard title="Severity Frequency">
                {severityCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={severityCounts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                      <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {severityCounts.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
            </div>

            {/* Scan Timeline */}
            <ChartCard title="Scan Activity (Last 30 Days)" className="mb-8">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215 20% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="scans" stroke="hsl(186 100% 50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Top Targets */}
            <ChartCard title="Top Scanned Targets">
              <div className="space-y-3">
                {topTargets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="font-mono text-sm text-foreground">{t.target}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-mono">{t.count} scans</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </>
        )}
      </div>
      <AssistantChat />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="cyber-card p-5" style={{ backdropFilter: "blur(12px)", background: "hsl(var(--card) / 0.7)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`cyber-card p-5 ${className ?? ""}`} style={{ backdropFilter: "blur(12px)", background: "hsl(var(--card) / 0.7)" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4 font-mono uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>;
}
