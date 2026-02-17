import { Shield, Zap, Lock, Globe, RefreshCw, Activity, BarChart3, LogOut } from "lucide-react";
import { ScannerInput } from "@/components/ScannerInput";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { SecurityReport } from "@/components/SecurityReport";
import { AssistantChat } from "@/components/AssistantChat";
import { FluidBackground } from "@/components/FluidBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSecurityAnalysis } from "@/hooks/useSecurityAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isScanning, content, target, analyze, reset } = useSecurityAnalysis();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const showResults = content.length > 0;
  const showScanning = isScanning && !showResults;

  return (
    <div className="min-h-screen relative">
      <FluidBackground />

      {/* Top Nav */}
      {user && (
        <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/30"
          style={{ background: "hsl(var(--background) / 0.3)", backdropFilter: "blur(12px)" }}
        >
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{user.email}</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px), 
                             linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-border cyber-glow-intense mb-6"
              style={{ background: "hsl(var(--card) / 0.6)", backdropFilter: "blur(12px)" }}
            >
              <Shield className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              <span className="text-gradient-cyber">emmy-scan-ai</span>
              <span className="text-foreground"> 🛰️</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              Enterprise-grade AI-powered defensive security intelligence platform.
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto font-mono">
              Passive vulnerability analysis • Risk scoring • Threat intelligence • Hardening guidance
            </p>
          </div>

          <ScannerInput onScan={analyze} isScanning={isScanning} />

          {!showResults && !showScanning && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
              <FeatureCard icon={<Activity className="w-5 h-5" />} title="Risk Scoring" description="0-100 risk score with compromise likelihood assessment" />
              <FeatureCard icon={<Zap className="w-5 h-5" />} title="Threat Intel" description="CVE patterns, exposure analysis, and anomaly detection" />
              <FeatureCard icon={<Lock className="w-5 h-5" />} title="Hardening" description="Ready-to-use defensive commands and configurations" />
              <FeatureCard icon={<Globe className="w-5 h-5" />} title="Full Coverage" description="SSL/TLS, DNS, headers, ports, and config analysis" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 pb-16 relative">
        {showScanning && <ScanningAnimation />}
        {showResults && target && (
          <>
            <div className="flex justify-center mb-4">
              <Button variant="outline" onClick={reset} className="border-border hover:bg-secondary"
                style={{ backdropFilter: "blur(8px)", background: "hsl(var(--card) / 0.6)" }}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> New Scan
              </Button>
            </div>
            <SecurityReport target={target} content={content} isStreaming={isScanning} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 relative" style={{ background: "hsl(var(--background) / 0.5)", backdropFilter: "blur(8px)" }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-mono">emmy-scan-ai 🛰️ • Enterprise defensive security intelligence</p>
          <p className="text-muted-foreground text-xs font-mono mt-2 opacity-70">created by emmy-brain-codes 🛰️</p>
          <p className="text-muted-foreground/50 text-xs mt-3 max-w-lg mx-auto">
            Defensive analysis for authorized systems only. Users must have permission to assess any target.
          </p>
        </div>
      </footer>

      <AssistantChat />
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="cyber-card p-5 text-center hover:cyber-glow transition-all duration-300 group"
      style={{ backdropFilter: "blur(12px)", background: "hsl(var(--card) / 0.6)" }}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary/20 transition-colors">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

export default Index;
