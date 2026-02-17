import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseSecurityAnalysisResult {
  isScanning: boolean;
  content: string;
  target: string | null;
  analyze: (target: string) => Promise<void>;
  reset: () => void;
}

function extractRiskScore(text: string): number | null {
  const match = text.match(/\*\*Risk Score:\s*(\d+)\s*\/\s*100\*\*/i)
    || text.match(/Risk Score:\s*(\d+)\s*\/\s*100/i);
  if (match) {
    const score = parseInt(match[1]);
    if (score >= 0 && score <= 100) return score;
  }
  return null;
}

function extractSeveritySummary(text: string): string {
  const severities: string[] = [];
  if (text.toLowerCase().includes("critical")) severities.push("Critical");
  if (text.toLowerCase().includes("high")) severities.push("High");
  if (text.toLowerCase().includes("medium")) severities.push("Medium");
  if (text.toLowerCase().includes("low")) severities.push("Low");
  return severities.join(", ") || "Info";
}

export function useSecurityAnalysis(): UseSecurityAnalysisResult {
  const [isScanning, setIsScanning] = useState(false);
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<string | null>(null);

  const saveScan = useCallback(async (targetVal: string, report: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const riskScore = extractRiskScore(report);
    const severitySummary = extractSeveritySummary(report);

    await supabase.from("scans").insert({
      user_id: user.id,
      target: targetVal,
      risk_score: riskScore,
      severity_summary: severitySummary,
      full_report: report,
    } as any);

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "scan_completed",
      target: targetVal,
      metadata: { risk_score: riskScore, severity_summary: severitySummary },
    } as any);
  }, []);

  const analyze = useCallback(async (targetInput: string) => {
    setIsScanning(true);
    setContent("");
    setTarget(targetInput);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-security`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ target: targetInput }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (response.status === 402) {
          toast.error("Service temporarily unavailable. Please try again later.");
        } else {
          toast.error(errorData.error || "Failed to analyze target");
        }
        setIsScanning(false);
        return;
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              fullContent += deltaContent;
              setContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              fullContent += deltaContent;
              setContent(fullContent);
            }
          } catch { /* ignore */ }
        }
      }

      // Save to DB
      await saveScan(targetInput, fullContent);
      toast.success("Security analysis complete");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to complete security analysis");
    } finally {
      setIsScanning(false);
    }
  }, [saveScan]);

  const reset = useCallback(() => {
    setContent("");
    setTarget(null);
    setIsScanning(false);
  }, []);

  return { isScanning, content, target, analyze, reset };
}
