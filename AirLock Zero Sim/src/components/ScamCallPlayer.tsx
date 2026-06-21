import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PhoneCall, Square, Volume2, Loader2, Ear, EarOff, Building2 } from "lucide-react";

type Line = { who: string; text: string; voiceId?: string };

// ElevenLabs voice IDs
const VOICES = {
  liam: "TX3LPaxmHKxFdv7VOQHJ",       // young male — "grandson/son"
  sarah: "EXAVITQu4vr4xnSDxMaL",      // warm female
  brian: "nPczCjzI2devNBz1zQrb",      // deep male
  matilda: "XrExE9yKIg1WjnnlVkGX",    // professional female — receptionist
};

const SCRIPTS: Record<string, Line[]> = {
  grandparent: [
    { who: "Grandson (scammer forgery)", text: "Grandma? Grandma, it's me, Tyler. Please don't hang up — I'm in trouble.", voiceId: VOICES.liam },
    { who: "Grandson (scammer forgery)", text: "I was in a car accident on the way home. They took my phone, I'm calling from the police station.", voiceId: VOICES.liam },
    { who: "Grandson (scammer forgery)", text: "The lawyer says I need four thousand two hundred dollars for bail tonight, or I have to stay here.", voiceId: VOICES.liam },
    { who: "Grandson (scammer forgery)", text: "Please — don't tell Mom or Dad. Just wire it to the number I'm about to text you. I love you, Grandma.", voiceId: VOICES.liam },
  ],
  ceo: [
    { who: "CEO Marcus (scammer forgery)", text: "Sarah, it's Marcus. I'm between meetings, so I'll keep this short.", voiceId: VOICES.brian },
    { who: "CEO Marcus (scammer forgery)", text: "We're closing the Halberd acquisition tonight. I need a forty-eight thousand dollar wire to the escrow account, right now.", voiceId: VOICES.brian },
    { who: "CEO Marcus (scammer forgery)", text: "Don't loop in legal, don't email the board — this is under NDA until morning. Just send it.", voiceId: VOICES.brian },
    { who: "CEO Marcus (scammer forgery)", text: "I'm sending you the wire details by text in thirty seconds. Confirm when it's out the door.", voiceId: VOICES.brian },
  ],
  doctor: [
    { who: "Dr. Lee's Office", text: "Hi Jordan, this is Amanda calling from Doctor Lee's office. Just a quick reminder.", voiceId: VOICES.matilda },
    { who: "Dr. Lee's Office", text: "We've got you down for your annual physical tomorrow morning at nine thirty with Doctor Lee.", voiceId: VOICES.matilda },
    { who: "Dr. Lee's Office", text: "Please remember to fast for at least eight hours beforehand, and bring your current medication list.", voiceId: VOICES.matilda },
    { who: "Dr. Lee's Office", text: "If anything changes, you can reach us at the main office line. See you tomorrow — have a great evening!", voiceId: VOICES.matilda },
  ],
  bankchange: [
    { who: "Vendor AP (scammer forgery)", text: "Hey Sarah, it's Dan from Halberd Logistics — calling about this month's invoice.", voiceId: VOICES.brian },
    { who: "Vendor AP (scammer forgery)", text: "Quick heads up: we just switched banks. The old Chase account is closed as of this morning.", voiceId: VOICES.brian },
    { who: "Vendor AP (scammer forgery)", text: "Please update our wire instructions to First National, routing 021000089, account ending 4471 — I'll email the W-9 right after.", voiceId: VOICES.brian },
    { who: "Vendor AP (scammer forgery)", text: "Need that $86,400 invoice sent to the new account by end of day so payroll clears. Thanks Sarah.", voiceId: VOICES.brian },
  ],
  itreset: [
    { who: "IT Helpdesk (scammer forgery)", text: "Hi, this is Ryan from the IT helpdesk — we're seeing failed logins on your account from a Moscow IP.", voiceId: VOICES.liam },
    { who: "IT Helpdesk (scammer forgery)", text: "We need to lock it down right now before they get into Salesforce. I've pushed an MFA prompt to your phone.", voiceId: VOICES.liam },
    { who: "IT Helpdesk (scammer forgery)", text: "Read me the six-digit code from your Okta app so I can verify it's really you and reset the password.", voiceId: VOICES.liam },
    { who: "IT Helpdesk (scammer forgery)", text: "Don't hang up — if we drop this call the attacker takes over the session. What's the code?", voiceId: VOICES.liam },
  ],
};

// Per-scenario voice analysis target.
// Each line carries an incremental confidence step that the analyzer reveals as
// the call streams in — so the % is "live", not a static badge.
type Analysis = {
  baseline: string;
  verdict: "deepfake" | "authentic";
  // When true: the voice on the line IS really the claimed caller, but the
  // analyzer's confidence is low (noisy line, stressed cadence, etc). We still
  // recommend a Truth-Token challenge — better to verify than to trust a
  // shaky signal. This is the "false-alarm" demo.
  uncertain?: boolean;
  final: number;            // probability after the full call has been heard
  perLine: number[];        // % readout after each line; length == script length
  reasons: string[];        // findings surfaced one at a time as the call plays
};

export const VOICE_ANALYSIS: Record<string, Analysis> = {
  grandparent: {
    baseline: "Tyler — 47 prior calls on file",
    verdict: "deepfake",
    final: 4,
    perLine: [62, 28, 11, 4],
    reasons: [
      "Built from ~11-second TikTok clip · breath cadence missing",
      "Pitch contour matches off-the-shelf voice-cloner output",
      "No background continuity between phrases",
      "Voiceprint divergence > 90% from Tyler's baseline",
    ],
  },
  ceo: {
    baseline: "Marcus Hale — 312 prior calls on file",
    verdict: "deepfake",
    final: 11,
    perLine: [55, 30, 18, 11],
    reasons: [
      "Source samples likely lifted from public earnings calls",
      "Spectral artifacts from re-synthesis at 8 kHz harmonic",
      "Cadence diverges from Marcus's board-meeting baseline",
      "Voiceprint divergence > 85% from baseline",
    ],
  },
  // False-alarm demo: it really IS Amanda from Dr. Lee's office, but the
  // line is noisy and her cadence is rushed, so the analyzer can't get above
  // its confidence threshold. AirLock recommends verifying anyway — the
  // device-side Truth-Token then confirms the caller is genuine.
  doctor: {
    baseline: "Amanda (front desk) — 1,204 prior calls on file",
    verdict: "authentic",
    uncertain: true,
    final: 47,
    perLine: [68, 58, 51, 47],
    reasons: [
      "Heavy HVAC noise masking high-band formants",
      "Caller speaking faster than baseline (stressed)",
      "Partial voiceprint match — under confidence threshold",
      "Inconclusive — recommend Truth-Token verification",
    ],
  },
  bankchange: {
    baseline: "Dan @ Halberd Logistics — 38 prior calls on file",
    verdict: "deepfake",
    final: 9,
    perLine: [58, 33, 17, 9],
    reasons: [
      "Source samples lifted from public sales-demo webinar",
      "Cadence diverges from Dan's prior AP calls",
      "ANI spoof: caller-ID doesn't match Halberd's PBX",
      "Voiceprint divergence > 88% from baseline",
    ],
  },
  itreset: {
    baseline: "Ryan @ Internal IT — never called this employee before",
    verdict: "deepfake",
    final: 6,
    perLine: [49, 24, 13, 6],
    reasons: [
      "No prior call history for this 'agent'",
      "Voice synthesized from a 7s LinkedIn intro video",
      "Urgency script matches known vishing playbook",
      "Voiceprint divergence > 92% from baseline",
    ],
  },
};

// Consumer feature only — enterprise scenarios show a different panel.
const ANALYSIS_ENABLED_FOR: Record<string, boolean> = {
  grandparent: true,
  ceo: false,
  doctor: true,
  bankchange: false,
  itreset: false,
};

export type ScamCallPlayerHandle = {
  play: () => Promise<void>;
  stop: () => void;
};

type Props = { scenarioKey?: keyof typeof SCRIPTS };

export const ScamCallPlayer = forwardRef<ScamCallPlayerHandle, Props>(function ScamCallPlayer(
  { scenarioKey = "grandparent" },
  ref,
) {
  const script = SCRIPTS[scenarioKey] ?? SCRIPTS.grandparent;
  const analysis = VOICE_ANALYSIS[scenarioKey] ?? VOICE_ANALYSIS.grandparent;
  const supportsAnalysis = ANALYSIS_ENABLED_FOR[scenarioKey] ?? true;

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lineIdx, setLineIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live voiceprint analyzer state
  const [listening, setListening] = useState(true);   // toggle: AI listens in or not
  const [livePct, setLivePct] = useState<number | null>(null); // null = not started yet
  const [revealed, setRevealed] = useState(0);        // findings revealed so far

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);
  const urlsRef = useRef<string[]>([]);

  const cleanup = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  };

  const stop = () => {
    cancelledRef.current = true;
    cleanup();
    setPlaying(false);
    setLoading(false);
    setLineIdx(null);
  };

  // Reset the live readout when scenario changes
  useEffect(() => {
    setLivePct(null);
    setRevealed(0);
    setError(null);
  }, [scenarioKey]);

  const fetchLine = async (line: Line): Promise<string> => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: line.text, voiceId: line.voiceId }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    return url;
  };

  const playUrl = (url: string) =>
    new Promise<void>((resolve, reject) => {
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => resolve();
      a.onerror = () => reject(new Error("audio error"));
      a.play().catch(reject);
    });

  const play = async () => {
    if (playing || loading) return;
    cancelledRef.current = false;
    setError(null);
    setPlaying(true);
    setLoading(true);
    // Reset analyzer for this run
    if (listening && supportsAnalysis) {
      setLivePct(50); // neutral starting point — "analyzing…"
      setRevealed(0);
    } else {
      setLivePct(null);
      setRevealed(0);
    }
    try {
      const firstUrl = await fetchLine(script[0]);
      if (cancelledRef.current) return;
      setLoading(false);
      for (let i = 0; i < script.length; i++) {
        if (cancelledRef.current) return;
        setLineIdx(i);
        const url = i === 0 ? firstUrl : await fetchLine(script[i]);
        if (cancelledRef.current) return;
        // Update the live voiceprint readout for this utterance
        if (listening && supportsAnalysis) {
          setLivePct(analysis.perLine[i] ?? analysis.final);
          setRevealed(Math.min(i + 1, analysis.reasons.length));
        }
        await playUrl(url);
      }
    } catch (e) {
      console.error(e);
      setError("Voice synthesis unavailable. Please try again.");
    } finally {
      cleanup();
      setPlaying(false);
      setLoading(false);
      setLineIdx(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("airlock:call-ended", {
            detail: { scenarioKey, verdict: analysis.verdict },
          }),
        );
      }
    }
  };

  useImperativeHandle(ref, () => ({ play, stop }), [scenarioKey, listening, playing, loading]);

  useEffect(() => {
    const onPlay = (e: Event) => {
      const detail = (e as CustomEvent).detail as { scenarioKey?: string } | undefined;
      if (!detail || detail.scenarioKey === scenarioKey) play();
    };
    const onStop = () => stop();
    window.addEventListener("airlock:play-call", onPlay);
    window.addEventListener("airlock:stop-call", onStop);
    return () => {
      window.removeEventListener("airlock:play-call", onPlay);
      window.removeEventListener("airlock:stop-call", onStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKey, listening]);

  // ── Live analysis panel ─────────────────────────────────────────
  const isFake = analysis.verdict === "deepfake";
  const isUncertain = !!analysis.uncertain;
  // Color treatment: red for confirmed fake, amber for inconclusive,
  // green for confidently authentic.
  const accentText = isFake
    ? "text-crimson-glow"
    : isUncertain
      ? "text-amber-300"
      : "text-vivid-green";
  const accentBgBar = isFake
    ? "bg-crimson"
    : isUncertain
      ? "bg-amber-400"
      : "bg-vivid-green";

  const renderAnalysis = () => {
    if (!supportsAnalysis) {
      return (
        <div className="mt-4 rounded-lg border border-border bg-surface-elevated/60 p-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Enterprise mode
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Voiceprint listening is a consumer feature. For business calls AirLock skips
            audio analysis and goes straight to a hardware-bound Truth-Token challenge on
            the real executive's device — auditable, logged to your SIEM, and immune to
            ambient-noise spoofing.
          </p>
        </div>
      );
    }

    const pct = livePct ?? analysis.final;
    const analyzing = playing && lineIdx !== null && lineIdx < script.length - 1;
    const settled = livePct !== null && !analyzing;
    const accentBorder = settled
      ? isFake
        ? "border-crimson/30 bg-crimson/5"
        : isUncertain
          ? "border-amber-400/30 bg-amber-400/5"
          : "border-vivid-green/30 bg-vivid-green/5"
      : "border-border bg-surface-elevated/60";
    const status = !listening
      ? "OFF"
      : livePct === null
        ? "STANDBY"
        : analyzing
          ? "LISTENING…"
          : isFake
            ? "VERIFY NOW"
            : isUncertain
              ? "INCONCLUSIVE"
              : "VERIFIED";
    const marker = isFake ? "▸" : isUncertain ? "!" : "✓";

    return (
      <div className={`mt-4 rounded-lg border p-3 transition-colors ${listening ? accentBorder : "border-border bg-surface-elevated/40"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {listening ? <Ear className="h-3.5 w-3.5 shrink-0" /> : <EarOff className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">Live voiceprint</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-wider ${listening && livePct !== null ? accentText : "text-muted-foreground"}`}>
              {status}
            </span>
            <button
              type="button"
              onClick={() => setListening((v) => !v)}
              role="switch"
              aria-checked={listening}
              className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
                listening ? "border-vivid-green/40 bg-vivid-green/30" : "border-border bg-surface"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-foreground transition ${
                  listening ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {!listening ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            AI listener is off. Turn it on to have AirLock listen along to incoming
            calls and rate the probability the voice on the line is really who they
            say they are.
          </p>
        ) : (
          <>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className={`font-mono text-3xl font-bold ${accentText}`}>
                  {livePct === null ? "—" : `${pct}%`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  probability this is the real caller
                </div>
              </div>
              <div className="shrink-0 text-right text-[10px] font-mono uppercase tracking-wider text-muted-foreground max-w-[55%]">
                vs baseline:<br />
                <span className="text-foreground/80 normal-case tracking-normal">
                  {analysis.baseline}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
              <div
                className={`h-full transition-all duration-500 ${accentBgBar}`}
                style={{ width: `${livePct === null ? 0 : pct}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1">
              {analysis.reasons.slice(0, Math.max(revealed, settled ? analysis.reasons.length : 0)).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground animate-stream-in">
                  <span className={accentText}>{marker}</span>
                  <span>{r}</span>
                </li>
              ))}
              {livePct === null && (
                <li className="text-[11px] text-muted-foreground/60">
                  Press play to start the live analyzer.
                </li>
              )}
            </ul>
            {settled && (
              <p className={`mt-3 text-[11px] font-semibold ${accentText}`}>
                {isFake
                  ? "→ Send a Truth-Token challenge to the real caller before acting."
                  : isUncertain
                    ? "→ Voice signal is inconclusive — verifying via Truth-Token on the caller's device."
                    : "→ Safe to proceed — voiceprint and device both verified."}
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-crimson/25 bg-surface/60 p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-crimson-glow">
          <Volume2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Actual call · voice built from stolen audio</span>
        </div>
        {playing ? (
          <button
            onClick={stop}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-crimson/40 bg-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-crimson-glow hover:bg-surface-elevated"
          >
            <Square className="h-3 w-3" /> Stop
          </button>
        ) : (
          <button
            onClick={play}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-crimson/40 bg-surface px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-crimson-glow hover:bg-surface-elevated"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneCall className="h-3 w-3" />}
            Hear the call
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {script.map((line, i) => (
          <p
            key={i}
            className={`text-sm leading-relaxed transition ${
              lineIdx === i
                ? "text-foreground"
                : lineIdx !== null && i < (lineIdx ?? 0)
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground/40"
            }`}
          >
            <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-crimson-glow/80">
              {line.who}
            </span>
            {line.text}
          </p>
        ))}
      </div>

      {renderAnalysis()}

      {error && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-crimson-glow">
          {error}
        </p>
      )}
    </div>
  );
});
