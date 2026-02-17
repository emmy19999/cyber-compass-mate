import { Download, FileText, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  target: string;
  content: string;
}

export function ExportButtons({ target, content }: ExportButtonsProps) {
  const downloadFile = (data: string, filename: string, mime: string) => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const md = `# Security Analysis Report\n\n**Target:** ${target}\n**Date:** ${new Date().toISOString()}\n\n---\n\n${content}`;
    downloadFile(md, `emmy-scan-${target}-${Date.now()}.md`, "text/markdown");
  };

  const exportJSON = () => {
    const json = JSON.stringify({
      tool: "emmy-scan-ai",
      target,
      timestamp: new Date().toISOString(),
      report: content,
    }, null, 2);
    downloadFile(json, `emmy-scan-${target}-${Date.now()}.json`, "application/json");
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportMarkdown} className="border-border hover:bg-secondary text-xs">
        <FileText className="w-3.5 h-3.5 mr-1.5" />
        Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={exportJSON} className="border-border hover:bg-secondary text-xs">
        <FileJson className="w-3.5 h-3.5 mr-1.5" />
        JSON
      </Button>
    </div>
  );
}
