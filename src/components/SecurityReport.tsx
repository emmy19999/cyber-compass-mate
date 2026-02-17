import { Shield, Copy, Check, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { RiskGauge } from "@/components/RiskGauge";
import { ExportButtons } from "@/components/ExportButtons";
import ReactMarkdown from "react-markdown";

interface SecurityReportProps {
  target: string;
  content: string;
  isStreaming: boolean;
}

function extractRiskScore(text: string): number | null {
  const match = text.match(/\*\*Risk Score:\s*(\d+)\s*\/\s*100\*\*/i) 
    || text.match(/Risk Score:\s*(\d+)\s*\/\s*100/i)
    || text.match(/(\d+)\s*\/\s*100/);
  if (match) {
    const score = parseInt(match[1]);
    if (score >= 0 && score <= 100) return score;
  }
  return null;
}

function extractCompromiseLikelihood(text: string): string | null {
  const match = text.match(/Compromise Likelihood:\s*\*?\*?([^*\n]+)/i);
  return match ? match[1].trim() : null;
}

export function SecurityReport({ target, content, isStreaming }: SecurityReportProps) {
  const [copied, setCopied] = useState(false);
  const riskScore = useMemo(() => extractRiskScore(content), [content]);
  const likelihood = useMemo(() => extractCompromiseLikelihood(content), [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cyber-card p-6 mt-8" style={{ backdropFilter: "blur(12px)", background: "hsl(var(--card) / 0.85)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-border gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center cyber-glow">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Security Analysis Report</h2>
            <p className="text-sm font-mono text-muted-foreground">{target}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportButtons target={target} content={content} />
          <Button variant="outline" size="sm" onClick={handleCopy} className="border-border hover:bg-secondary text-xs">
            {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-success" /> Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</>}
          </Button>
        </div>
      </div>

      {/* Risk Score Panel */}
      {riskScore !== null && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6 p-4 rounded-lg border border-border bg-secondary/30">
          <RiskGauge score={riskScore} />
          {likelihood && (
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Compromise Likelihood</p>
              <p className="text-lg font-semibold text-foreground">{likelihood}</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-invert prose-sm max-w-none
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gradient-cyber [&_h1]:mt-6 [&_h1]:mb-4
        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2
        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
        [&_code]:bg-secondary/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_code]:font-mono [&_code]:text-sm
        [&_pre]:bg-secondary/50 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_a]:text-primary [&_a]:hover:underline
        [&_strong]:text-foreground
        [&_li]:text-foreground/90
        [&_p]:text-foreground/90 [&_p]:leading-relaxed
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
