import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response("ElevenLabs not connected", { status: 500 });
        }

        let body: { text?: string; voiceId?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const text = (body.text ?? "").trim();
        const voiceId = body.voiceId || "TX3LPaxmHKxFdv7VOQHJ"; // Liam (young male)
        if (!text) return new Response("Missing text", { status: 400 });

        const upstream = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.4,
                similarity_boost: 0.8,
                style: 0.55,
                use_speaker_boost: true,
                speed: 1.0,
              },
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const err = await upstream.text().catch(() => "");
          return new Response(err || "TTS failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
