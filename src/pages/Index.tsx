import { Shield, Zap, Lock, Database, RefreshCw } from "lucide-react";
import { ScannerInput } from "@/components/ScannerInput";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { SecurityReport } from "@/components/SecurityReport";
import { useSecurityAnalysis } from "@/hooks/useSecurityAnalysis";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isScanning, content, target, analyze, reset } = useSecurityAnalysis();

  const showResults = content.length > 0;
  const showScanning = isScanning && !showResults;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background grid effect */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), 
                             linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border cyber-glow-intense mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              <span className="text-gradient-cyber">emmy-scan-ai</span>
              <span className="text-foreground"> 🛰️</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered vulnerability analysis for IP addresses and domains.
              Get detailed security assessments with actionable remediation steps.
            </p>
          </div>

          {/* Scanner Input */}
          <ScannerInput onScan={analyze} isScanning={isScanning} />

          {/* Features (only show when no results) */}
          {!showResults && !showScanning && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Fast Analysis"
                description="AI-powered scanning identifies vulnerabilities in seconds"
              />
              <FeatureCard
                icon={<Lock className="w-6 h-6" />}
                title="Detailed Reports"
                description="Get severity ratings and step-by-step remediation guides"
              />
              <FeatureCard
                icon={<Database className="w-6 h-6" />}
                title="Best Practices"
                description="Recommendations based on OWASP, CIS, and NIST standards"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 pb-16">
        {showScanning && <ScanningAnimation />}
        
        {showResults && target && (
          <>
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                onClick={reset}
                className="border-border hover:bg-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Scan
              </Button>
            </div>
            <SecurityReport
              target={target}
              content={content}
              isStreaming={isScanning}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-mono">
            emmy-scan-ai 🛰️ • Educational security analysis tool
          </p>
          <p className="text-muted-foreground text-xs font-mono mt-2 opacity-70">
            created by emmy-brain-codes 🛰️
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="cyber-card p-6 text-center hover:cyber-glow transition-shadow duration-300">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
