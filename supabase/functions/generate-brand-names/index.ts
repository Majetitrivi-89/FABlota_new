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
    const { category, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a creative brand naming expert specializing in fashion and clothing brands. Generate unique, catchy, and memorable brand name suggestions.
    
For each suggestion, provide:
1. Brand name (2-3 words max)
2. A short tagline (5-7 words)

Focus on names that are:
- Easy to pronounce and remember
- Professional yet trendy
- Suitable for the Indian fashion market
- Convey quality and style

Return ONLY a JSON array with objects having "name" and "tagline" fields. No other text.`;

    const userPrompt = category 
      ? `Generate 5 unique brand name suggestions for a ${category} clothing brand${style ? ` with a ${style} style` : ''}. The brand should appeal to the Indian B2B market.`
      : `Generate 5 unique brand name suggestions for a general fashion/clothing brand. The brand should appeal to the Indian B2B market.`;

    console.log("Generating brand names for category:", category, "style:", style);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON array from the response
    let suggestions;
    try {
      // Extract JSON array from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback suggestions
      suggestions = [
        { name: "StyleCraft", tagline: "Crafting Your Perfect Style" },
        { name: "TrendVista", tagline: "Where Trends Meet Vision" },
        { name: "FashionForge", tagline: "Forging Fashion Excellence" },
        { name: "ThreadLux", tagline: "Luxury in Every Thread" },
        { name: "ApparelAura", tagline: "The Aura of Quality Apparel" },
      ];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-brand-names:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
