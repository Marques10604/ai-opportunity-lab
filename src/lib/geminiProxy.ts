/**
 * geminiProxy.ts
 * Secure Gemini API client — all calls go through the gemini-proxy Edge Function.
 * ZERO direct calls to Gemini from the frontend. Zero VITE_GEMINI_API_KEY usage.
 */

import { supabase } from "@/integrations/supabase/client";

interface GeminiProxyOptions {
  prompt: string;
  generationConfig?: {
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
  system_instruction?: {
    parts: { text: string }[];
  };
}

interface GeminiProxyResult {
  text: string | null;
  raw: unknown;
}

/**
 * Calls the gemini-proxy Edge Function securely.
 * Throws on network error or non-ok response.
 */
export async function callGemini(options: GeminiProxyOptions): Promise<GeminiProxyResult> {
  const { data, error } = await supabase.functions.invoke("gemini-proxy", {
    body: options,
    headers: {
      "x-execution-id": crypto.randomUUID(),
    },
  });

  if (error) {
    throw new Error(`gemini-proxy error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const text: string | null = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  return { text, raw: data };
}
