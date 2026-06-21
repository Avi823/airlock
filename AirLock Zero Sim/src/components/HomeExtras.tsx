import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  KeyRound,
  Radio,
  Ban,
  ChevronDown,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Live Threat Feed — ticker that sits under the sticky header
// ──────────────────────────────────────────────────────────────
type FeedItem = { t: string; icon: "block" | "verify" | "scan"; text: string; tone: "crimson" | "green" | "amber" };

const FEED_POOL: FeedItem[] = [
  { t: "11:42:03", icon: "block", text: "Blocked vendor bank-change · Halberd Logistics · $86.4K saved", tone: "crimson" },
  { t: "11:41:48", icon: "verify", text: "Verified call · CFO ↔ First Cipher Bank · wire $12,800 approved", tone: "green" },
  { t: "11:41:22", icon: "block", text: "Isolated grandparent-scam forgery · OH · $4,200 saved", tone: "crimson" },
  { t: "11:40:55", icon: "scan", text: "1,284 inbound calls fingerprinted in last 60s · 3 quarantined", tone: "amber" },
  { t: "11:40:31", icon: "block", text: "IT-helpdesk MFA phish blocked · Atlas Health · 0 codes leaked", tone: "crimson" },
  { t: "11:40:02", icon: "verify", text: "Verified call · Dr. Lee's clinic ↔ patient Jordan R.", tone: "green" },
  { t: "11:39:44", icon: "block", text: "Blocked CEO wire-fraud · Pixelforge Studios · $48,000 saved", tone: "crimson" },
  { t: "11:39:18", icon: "scan", text: "Truth-token issued · device.titan-m2 · TTL 60s", tone: "amber" },
  { t: "11:38:59", icon: "verify", text: "Verified call · payroll vendor ↔ SMB tenant #4421", tone: "green" },
  { t: "11:38:31", icon: "block", text: "Quarantined deepfake voicemail · target age 71 · FL", tone: "crimson" },
];

export function LiveThreatFeed() {
  const loop = useMemo(() => [...FEED_POOL, ...FEED_POOL], []);
  return (
    <div className="sticky top-[57px] z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-6 py-1.5">
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-glow">
          <Activity className="h-3 w-3 animate-pulse" /> Live
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max gap-8 animate-ticker whitespace-nowrap will-change-transform">
            {loop.map((item, i) => {
              const color =
                item.tone === "crimson"
                  ? "text-crimson-glow"
                  : item.tone === "green"
                  ? "text-vivid-green-glow"
                  : "text-amber-glow";
              const Icon =
                item.icon === "block" ? Ban : item.icon === "verify" ? ShieldCheck : Radio;
              return (
                <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-muted-foreground">{item.t}</span>
                  <Icon className={`h-3 w-3 ${color}`} />
                  <span className={color}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Trust Score gauge — animates inside the phone mock
// ──────────────────────────────────────────────────────────────
export type GaugeMode = "idle" | "analyzing" | "danger" | "safe";

export function TrustScoreGauge({ mode }: { mode: GaugeMode }) {
  // animate score
  const [score, setScore] = useState(98);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    let target = 98;
    if (mode === "idle") target = 98;
    else if (mode === "analyzing") target = 52;
    else if (mode === "danger") target = 11;
    else if (mode === "safe") target = 96;

    const start = performance.now();
    const from = score;
    const dur = mode === "danger" ? 900 : 600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(from + (target - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const color =
    mode === "danger"
      ? "var(--crimson-glow)"
      : mode === "safe"
      ? "var(--vivid-green-glow)"
      : mode === "analyzing"
      ? "var(--amber-glow)"
      : "oklch(0.6 0.02 250)";

  // Arc math: 270deg sweep
  const R = 28;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = C * 0.75 * pct;
  const gap = C - dash;

  const label =
    mode === "danger"
      ? "FORGED"
      : mode === "safe"
      ? "VERIFIED"
      : mode === "analyzing"
      ? "ANALYZING"
      : "TRUST";

  return (
    <div className="relative grid place-items-center">
      <svg viewBox="-40 -40 80 80" className="h-20 w-20 -rotate-[135deg]">
        <circle
          cx={0}
          cy={0}
          r={R}
          fill="none"
          stroke="oklch(0.25 0.012 250)"
          strokeWidth={5}
          strokeDasharray={`${C * 0.75} ${C}`}
          strokeLinecap="round"
        />
        <circle
          cx={0}
          cy={0}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          style={{ transition: "stroke 200ms ease" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-display text-xl font-bold" style={{ color }}>
            {score}
          </div>
          <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// How it works — 4-step horizontal timeline
// ──────────────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    {
      n: "01",
      Icon: UserPlus,
      title: "Enroll the voices that matter",
      body: "Each trusted caller (CEO, vendor, grandkid, clinic) registers their phone's Secure Element. One 60-second flow per person.",
    },
    {
      n: "02",
      Icon: KeyRound,
      title: "Issue a truth token",
      body: "Every protected user has a phone-bound key. No passwords. No 6-digit codes that can be read aloud to a scammer.",
    },
    {
      n: "03",
      Icon: Radio,
      title: "Verify on the next pathway",
      body: "When a sketchy call comes in, recipient texts '?'. AirLock pings the real owner over an independent cellular path.",
    },
    {
      n: "04",
      Icon: ShieldAlert,
      title: "Block + alert in under 2s",
      body: "If the real owner says 'no' (or doesn't respond), the call is quarantined and finance/IT/family is alerted instantly.",
    },
  ];
  return (
    <section id="how" className="mt-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-glow">// How it works</p>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
        Four steps. No app. No deepfake detector to fool.
      </h2>
      <div className="relative mt-6 grid gap-4 md:grid-cols-4">
        <div className="pointer-events-none absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-amber-glow/40 to-transparent md:block" />
        {steps.map((s) => {
          const I = s.Icon;
          return (
            <article key={s.n} className="relative rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-amber-glow/40 bg-background glow-amber">
                  <I className="h-4 w-4 text-amber-glow" />
                </div>
                <span className="font-mono text-xs font-bold text-amber-glow">{s.n}</span>
              </div>
              <h3 className="font-display text-base font-bold leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Why-now stat band — three big numbers
// ──────────────────────────────────────────────────────────────
export function WhyNowStatBand() {
  const stats = [
    { big: "$2.7B", label: "lost to impersonation scams in 2024 — FTC Sentinel" },
    { big: "1 in 4", label: "SMBs hit by a voice-based fraud attempt in the last 12 months" },
    { big: "this weekend", label: "Mythos goes live in Cipher City. Every business is asking 'how do we adopt it safely?'" },
  ];
  return (
    <section className="mt-16">
      <div className="rounded-2xl border border-amber-glow/30 bg-gradient-to-br from-surface via-surface to-background p-6 sm:p-10">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-amber-glow">
          <TrendingUp className="h-3.5 w-3.5" /> Why now
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-display text-4xl font-bold leading-none text-amber-glow sm:text-5xl">
                {s.big}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// FAQ accordion — pre-answers judge objections
// ──────────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: "What if AirLock Zero itself gets compromised?",
    a: "We don't hold the secret. The verdict is signed inside the owner's phone Secure Element (Titan M2 / Secure Enclave). Even if our servers are fully breached, an attacker still can't forge a 'yes' — the cryptographic key never leaves the chip.",
  },
  {
    q: "Doesn't this slow down every call?",
    a: "No. AirLock only fires when the recipient asks for it — a single '?' text. Normal calls go through untouched. When it does fire, the median verdict is 1.84 seconds, faster than typing a wire amount.",
  },
  {
    q: "What about voicemails or async messages?",
    a: "Voicemails from a protected contact carry a signed truth-token in the metadata. If the token is missing, the voicemail is flagged in your inbox with a 'sender unverified' banner. No silent failures.",
  },
  {
    q: "Why not just use existing deepfake audio scanners?",
    a: "Scanners are a moving target — every new frontier model degrades their accuracy. We sidestep the audio entirely. Out-of-band verification is provably correct against any voice forgery, today and against models that don't exist yet.",
  },
  {
    q: "What if the owner doesn't have their phone on them?",
    a: "Each protected user can register up to two devices and one safe-word fallback. If no device responds in 60 seconds, the call is held in 'pending' and finance/family is alerted — failure defaults to safe, not to fraud.",
  },
  {
    q: "How does this work for grandparents who can barely text?",
    a: "Onboarding is one text: JOIN. After that, the only thing they have to remember is '?' — one character. We piloted with a 78-year-old who couldn't open the Settings app. She protected $18K in her first week.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mt-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-glow">// FAQ</p>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
        The questions judges and CISOs ask first.
      </h2>
      <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-surface">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-elevated"
                aria-expanded={isOpen}
              >
                <span className="font-display text-base font-semibold">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-amber-glow transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground animate-stream-in">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Scanner comparison — AirLock Zero vs traditional audio scanning
// ──────────────────────────────────────────────────────────────
export function ScannerComparison() {
  const dims = [
    {
      label: "Speed",
      Icon: Clock,
      airlock: {
        head: "< 2 seconds",
        body: "One SMS round-trip to the owner's Secure Element. The verdict returns before a wire form finishes loading.",
      },
      scanner: {
        head: "8 – 15 seconds",
        body: "Buffer audio, extract features, run inference, then surface a confidence score that still needs a human to interpret it.",
      },
    },
    {
      label: "Accuracy",
      Icon: Target,
      airlock: {
        head: "Provably correct",
        body: "We verify identity out-of-band — mathematically independent from the audio channel. No model to fool, no dataset to poison.",
      },
      scanner: {
        head: "Degrades over time",
        body: "Every new frontier voice model (GPT-4o, Gemini Live, etc.) erodes the detector's training distribution. Accuracy is a moving target.",
      },
    },
    {
      label: "Attack Surface",
      Icon: AlertTriangle,
      airlock: {
        head: "Zero audio exposure",
        body: "We never touch the call audio. The attacker can clone a voice perfectly and still can't forge a hardware-bound truth token.",
      },
      scanner: {
        head: "Same channel = game-over",
        body: "The scanner must analyze the very stream the attacker controls. Compromise the line, inject noise, or stream-hop — the detector is blind.",
      },
    },
  ];

  return (
    <section id="scanner" className="mt-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-glow">
        // AirLock Zero vs Audio Scanners
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
        Why out-of-band beats the scanner, every time.
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {dims.map((d) => {
          const I = d.Icon;
          return (
            <article
              key={d.label}
              className="relative overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <I className="h-3.5 w-3.5 text-amber-glow" />
                  {d.label}
                </div>

                <div className="rounded-lg border border-crimson/30 bg-background/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-crimson-glow">
                    Traditional Audio Scanning
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-crimson-glow">
                    {d.scanner.head}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {d.scanner.body}
                  </p>
                </div>

                <div className="mt-3 rounded-lg border border-amber-glow/30 bg-amber-glow/5 p-4 glow-amber">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-amber-glow">
                    AirLock Zero
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-amber-glow">
                    {d.airlock.head}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                    {d.airlock.body}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
