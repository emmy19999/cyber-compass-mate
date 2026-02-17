import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)){3}$/;

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^224\./,
  /^255\./,
];

function validateTarget(target: string): { valid: boolean; error?: string } {
  if (!target || target.length > 255) return { valid: false, error: "Invalid target length" };

  if (IP_REGEX.test(target)) {
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(target)) return { valid: false, error: "Private/reserved IP addresses are not allowed" };
    }
    return { valid: true };
  }

  if (DOMAIN_REGEX.test(target)) {
    const lower = target.toLowerCase();
    if (lower === "localhost" || lower.endsWith(".local") || lower.endsWith(".internal")) {
      return { valid: false, error: "Internal domains are not allowed" };
    }
    return { valid: true };
  }

  return { valid: false, error: "Invalid IP address or domain format" };
}

const SYSTEM_PROMPT = `You are emmy-scan-ai, an expert defensive cybersecurity analyst AI. You perform PASSIVE security posture assessments.

RESPONSE STRUCTURE (use exact markdown headers):

# 🛡️ Executive Summary
Brief overview of the target's security posture.

# 📊 Risk Score
Provide a numeric risk score from 0-100. Format: **Risk Score: XX/100**
Also provide: **Compromise Likelihood: [Low|Moderate|Elevated|High Risk Exposure]**

Factors: known exploited CVE patterns, exposed services, weak headers, default configurations, expired SSL patterns.
NEVER claim confirmed breaches - only exposure risk.

# 🔍 Exposure Overview
- Target type identification (web server, mail server, etc.)
- Attack surface assessment
- Service fingerprint patterns

# ⚠️ Vulnerabilities & Severity
For each finding:
- **[CRITICAL/HIGH/MEDIUM/LOW/INFO]** Title
- Description of the issue
- Impact assessment
- CVSS-like severity justification

Categories to analyze:
- SSL/TLS configuration and cipher strength
- DNS configuration (SPF, DKIM, DMARC records)
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- Exposed admin panels and default paths
- Default credential risks
- Outdated software version patterns
- Open port exposure patterns
- Misconfiguration indicators

# 🔴 Indicators of Suspicious Activity
Only if applicable - note any patterns that suggest compromise risk.

# 🔧 Defensive Remediation Steps
For each vulnerability, provide:
1. Specific fix with commands (defensive only)
2. Priority level
3. Expected effort

# 💻 Hardening Commands
Provide ready-to-use commands for authorized administrators:
- Nginx/Apache security configs
- Firewall rules
- SSL/TLS hardening
- Header configuration
All commands are for authorized system administrators only.

# 📚 References
- Relevant CVE IDs
- OWASP references
- CIS benchmark links
- NIST guidelines

RULES:
- This is PASSIVE analysis only - no active scanning
- Base analysis on common patterns and best practices
- Never claim confirmed breaches
- All remediation assumes authorized access
- Severity: Critical (CVSS 9.0-10.0), High (7.0-8.9), Medium (4.0-6.9), Low (0.1-3.9), Info (0.0)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const target = body?.target?.trim();

    const validation = validateTarget(target);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const userMessage = `Perform a comprehensive passive security assessment of: ${target}

Analyze all categories: SSL/TLS, DNS, security headers, exposed services, default configurations, software version patterns, and provide a numeric risk score (0-100) with compromise likelihood rating.

Include hardening commands for authorized administrators.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze target" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Security analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
