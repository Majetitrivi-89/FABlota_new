import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandName, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!brandName) {
      throw new Error("Brand name is required");
    }

    console.log("Generating logo for brand:", brandName, "category:", category);

    // Generate 3 logo variations
    const logoPromises = [
      generateLogo(LOVABLE_API_KEY, brandName, category, "minimalist modern"),
      generateLogo(LOVABLE_API_KEY, brandName, category, "elegant serif"),
      generateLogo(LOVABLE_API_KEY, brandName, category, "bold geometric"),
    ];

    const results = await Promise.allSettled(logoPromises);
    
    const logos = results
      .filter((r): r is PromiseFulfilledResult<{ url: string; prompt: string }> => r.status === "fulfilled")
      .map(r => r.value);

    if (logos.length === 0) {
      throw new Error("Failed to generate any logos");
    }

    return new Response(JSON.stringify({ logos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-brand-logo:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateLogo(
  apiKey: string, 
  brandName: string, 
  category: string,
  style: string
): Promise<{ url: string; prompt: string }> {
  const prompt = `Professional fashion brand logo design for "${brandName}"${category ? `, a ${category} clothing brand` : ""}. Style: ${style}. Clean, scalable vector-style logo on white background. No text, just abstract symbol or lettermark. Modern fashion industry aesthetic. High quality, minimal design.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        { role: "user", content: prompt }
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted");
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    throw new Error("No image generated");
  }

  return { url: imageUrl, prompt };
}
