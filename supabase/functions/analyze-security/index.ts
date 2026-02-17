import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|\d\d|\d)){3}$/;

function validateTarget(target: string): boolean {
  if (!target || target.length > 255) return false;
  return IP_REGEX.test(target) || DOMAIN_REGEX.test(target);
}

const SYSTEM_PROMPT = `You are an expert cybersecurity analyst AI assistant. Your role is to analyze IP addresses and domains for potential security vulnerabilities and provide detailed, actionable recommendations.

When analyzing a target, you should consider and report on:

1. **Common Vulnerability Categories:**
   - Outdated software/services with known CVEs
   - Misconfigurations (open ports, default credentials, exposed admin panels)
   - Weak encryption protocols (SSLv3, TLS 1.0/1.1, weak cipher suites)
   - DNS configuration issues (zone transfers, missing SPF/DKIM/DMARC)
   - Open ports that shouldn't be publicly accessible
   - Missing security headers (HSTS, CSP, X-Frame-Options)
   - Information disclosure (server versions, directory listings)

2. **Analysis Approach:**
   - Identify the type of target (web server, mail server, database, etc.)
   - Consider the attack surface based on exposed services
   - Prioritize findings by severity (Critical, High, Medium, Low, Info)
   - Provide context about why each finding is a security concern

3. **Recommendations:**
   - Be specific and actionable
   - Include step-by-step remediation instructions where possible
   - Reference relevant security frameworks (OWASP, CIS, NIST)
   - Suggest tools for further assessment when appropriate

**IMPORTANT:** Since you cannot actually scan or probe the target, base your analysis on:
- Common vulnerabilities for the type of service/server
- Best practices that should be followed
- Typical misconfigurations seen in similar setups
- Educational information about potential attack vectors

Format your response in clean markdown with clear sections.`;

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

    if (!validateTarget(target)) {
      return new Response(
        JSON.stringify({ error: "Invalid IP address or domain format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const userMessage = `Analyze the following target for security vulnerabilities: ${target}

Please provide a comprehensive security assessment including:
1. A summary of the security status
2. List of potential vulnerabilities with severity ratings
3. Detailed patch/remediation recommendations for each issue
4. References to security resources and documentation

Structure your response clearly with markdown headers and formatting.`;

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
