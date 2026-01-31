import { Shield, AlertTriangle, CheckCircle, Info, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SecurityReportProps {
  target: string;
  content: string;
  isStreaming: boolean;
}

export function SecurityReport({ target, content, isStreaming }: SecurityReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse markdown to basic HTML-like rendering
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = "";
    let codeLanguage = "";

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3);
          codeContent = "";
        } else {
          elements.push(
            <pre
              key={`code-${index}`}
              className="bg-secondary/50 border border-border rounded-lg p-4 overflow-x-auto font-mono text-sm my-4"
            >
              <code>{codeContent}</code>
            </pre>
          );
          inCodeBlock = false;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += (codeContent ? "\n" : "") + line;
        return;
      }

      // Headers
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {line.slice(4)}
          </h3>
        );
        return;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-foreground mt-8 mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Shield className="w-6 h-6 text-primary" />
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-gradient-cyber mt-6 mb-4">
            {line.slice(2)}
          </h1>
        );
        return;
      }

      // Bullet points with severity detection
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const bulletContent = line.slice(2);
        let severityClass = "";
        let icon = <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />;

        if (bulletContent.toLowerCase().includes("critical")) {
          severityClass = "severity-critical";
          icon = <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />;
        } else if (bulletContent.toLowerCase().includes("high")) {
          severityClass = "severity-high";
          icon = <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />;
        } else if (bulletContent.toLowerCase().includes("medium")) {
          severityClass = "severity-medium";
          icon = <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />;
        } else if (bulletContent.toLowerCase().includes("low") || bulletContent.toLowerCase().includes("info")) {
          severityClass = "severity-low";
          icon = <Info className="w-4 h-4 text-success shrink-0 mt-0.5" />;
        }

        elements.push(
          <div key={index} className="flex items-start gap-2 my-2 pl-2">
            {icon}
            <span className={severityClass}>{renderInlineStyles(bulletContent)}</span>
          </div>
        );
        return;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        const numberMatch = line.match(/^(\d+)\.\s(.*)$/);
        if (numberMatch) {
          elements.push(
            <div key={index} className="flex items-start gap-3 my-2 pl-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-mono flex items-center justify-center shrink-0">
                {numberMatch[1]}
              </span>
              <span>{renderInlineStyles(numberMatch[2])}</span>
            </div>
          );
        }
        return;
      }

      // Links
      if (line.includes("http")) {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          elements.push(
            <a
              key={index}
              href={urlMatch[1]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline my-2 font-mono text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {urlMatch[1]}
            </a>
          );
          return;
        }
      }

      // Regular paragraphs
      if (line.trim()) {
        elements.push(
          <p key={index} className="text-foreground/90 my-2 leading-relaxed">
            {renderInlineStyles(line)}
          </p>
        );
      } else {
        elements.push(<div key={index} className="h-2" />);
      }
    });

    return elements;
  };

  const renderInlineStyles = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-secondary/50 px-1.5 py-0.5 rounded text-primary font-mono text-sm">$1</code>');
    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="cyber-card p-6 mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Security Analysis Report</h2>
            <p className="text-sm font-mono text-muted-foreground">{target}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-border hover:bg-secondary"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="prose prose-invert max-w-none">
        {renderContent(content)}
        {isStreaming && (
          <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
