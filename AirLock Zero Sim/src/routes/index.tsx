import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Radio,
  Lock,
  Zap,
  Play,
  Users,
  Building2,
  Stethoscope,
  Check,
  X,
  TrendingUp,
  Sparkles,
  Cpu,
  KeyRound,
  Quote,
  Smartphone,
  Fingerprint,
  Send,
} from "lucide-react";
import { Term } from "@/components/Term";
import { GuidedTour, type TourStep } from "@/components/GuidedTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScamCallPlayer, type ScamCallPlayerHandle } from "@/components/ScamCallPlayer";
import { Reveal, Stagger } from "@/components/Reveal";
import { motion } from "framer-motion";
import {
  
  type GaugeMode,
  HowItWorks,
  WhyNowStatBand,
  FaqAccordion,
  ScannerComparison,
} from "@/components/HomeExtras";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AirLock Zero — Out-of-Band Deepfake Defense" },
      {
        name: "description",
        content:
          "Frictionless out-of-band identity verification that neutralizes scammer voice-forgery attacks in under two seconds.",
      },
      { property: "og:title", content: "AirLock Zero" },
      { property: "og:description", content: "Stop deepfake voice fraud with a single text message." },
    ],
  }),
  component: Index,
});

// ──────────────────────────────────────────────────────────────
// Scenarios
// ──────────────────────────────────────────────────────────────
type ScenarioKey = "ceo" | "grandparent" | "doctor" | "bankchange" | "itreset";
type Scenario = {
  key: ScenarioKey;
  label: string;
  callerName: string;
  callerTitle: string;
  initials: string;
  device: string;
  challenge: string;
  trustEdge: string;
  stream: StreamLine[];
};

type StreamLine = { id: number; text: string; tone: "gateway" | "context" | "routing" };

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  ceo: {
    key: "ceo",
    label: "CEO Wire Fraud",
    callerName: "Marcus Hale",
    callerTitle: "Chief Executive Officer",
    initials: "CEO",
    device: "device.marcus-hale-titan-m2",
    challenge: "🚨 Are you actually on a call right now asking Sarah in finance to wire $48,000?",
    trustEdge: "CFO Marcus",
    stream: [
      { id: 1, tone: "gateway", text: "[GATEWAY] SMS webhook triggered by authorized user: Sarah (CFO Ops)." },
      { id: 2, tone: "context", text: "[CONTEXT] Engine resolving: caller claims = Marcus Hale · role = CEO · request = wire." },
      { id: 3, tone: "routing", text: "[ROUTING] Truth-token af-9c2e dispatched to Marcus's Titan M2 secure element." },
    ],
  },
  grandparent: {
    key: "grandparent",
    label: "Grandparent Scam",
    callerName: "“Tyler” (Grandson)",
    callerTitle: "Claims: arrested, needs bail money",
    initials: "TY",
    device: "device.tyler-iphone-15",
    challenge: "🚨 Are you actually on the phone with Grandma right now asking her to wire $4,200?",
    trustEdge: "Grandson Tyler",
    stream: [
      { id: 1, tone: "gateway", text: "[GATEWAY] SMS webhook triggered by protected user: Eleanor (age 74)." },
      { id: 2, tone: "context", text: "[CONTEXT] Engine resolving: caller claims = Tyler · relation = grandson · urgency = HIGH." },
      { id: 3, tone: "routing", text: "[ROUTING] Truth-token gp-71f0 dispatched to Tyler's iPhone Secure Enclave." },
    ],
  },
  doctor: {
    key: "doctor",
    label: "Doctor's Office (real)",
    callerName: "Dr. Lee's Office",
    callerTitle: "Appointment reminder · routine",
    initials: "DR",
    device: "device.dr-lee-clinic-frontdesk",
    challenge: "🚨 Did your front desk just call Jordan R. to confirm tomorrow's 9:30am appointment?",
    trustEdge: "Dr. Lee Clinic",
    stream: [
      { id: 1, tone: "gateway", text: "[GATEWAY] SMS webhook triggered by patient: Jordan R." },
      { id: 2, tone: "context", text: "[CONTEXT] Engine resolving: caller claims = Dr. Lee's office · request = appointment reminder." },
      { id: 3, tone: "routing", text: "[ROUTING] Truth-token md-3c8a dispatched to clinic's verified front desk device." },
    ],
  },
  bankchange: {
    key: "bankchange",
    label: "Vendor Bank-Change",
    callerName: "“Dan” @ Halberd Logistics",
    callerTitle: "Claims: invoice needs new wire account",
    initials: "HL",
    device: "device.halberd-ap-pixel-9",
    challenge: "🚨 Did you just call Sarah in AP asking to redirect this month's $86,400 invoice to a new bank account?",
    trustEdge: "Halberd AP",
    stream: [
      { id: 1, tone: "gateway", text: "[GATEWAY] SMS webhook triggered by authorized user: Sarah (AP Lead)." },
      { id: 2, tone: "context", text: "[CONTEXT] Engine resolving: vendor claims = Halberd · request = wire instruction change." },
      { id: 3, tone: "routing", text: "[ROUTING] Truth-token bk-4d11 dispatched to Halberd's verified AP device." },
    ],
  },
  itreset: {
    key: "itreset",
    label: "IT Password Reset",
    callerName: "“Ryan” @ Internal IT",
    callerTitle: "Claims: emergency MFA reset",
    initials: "IT",
    device: "device.it-helpdesk-yubikey",
    challenge: "🚨 Is your helpdesk currently on the phone with Jamie asking them to read out their Okta MFA code?",
    trustEdge: "Internal IT",
    stream: [
      { id: 1, tone: "gateway", text: "[GATEWAY] SMS webhook triggered by protected user: Jamie (Sales)." },
      { id: 2, tone: "context", text: "[CONTEXT] Engine resolving: caller claims = IT · request = MFA code disclosure." },
      { id: 3, tone: "routing", text: "[ROUTING] Truth-token it-8e3f dispatched to IT on-call's verified device." },
    ],
  },
};

type Verdict = "idle" | "deepfake" | "verified";

const TOUR_STEPS: TourStep[] = [
  {
    selector: "[data-tour='scenario-selector']",
    title: "1. Pick a scenario",
    body: "Each tab is a different scam call — a fake CEO, a fake bank, a fake grandchild, plus a real call for comparison.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='autoplay']",
    title: "2. Press Auto-Play",
    body: "This runs the whole demo for you. Or answer the phone yourself to start the timer manually.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='phone']",
    title: "3. Watch the call come in",
    body: "The voice sounds perfect — that's the point. The call timer below only starts once you pick up.",
    placement: "right",
  },
  {
    selector: "[data-tour='stream']",
    title: "4. AirLock spots the request",
    body: "It listens for risky asks (wires, passwords, gift cards) and fires a challenge on a separate channel the scammer can't see.",
    placement: "left",
  },
  {
    selector: "[data-tour='channel-selector']",
    title: "5. Choose the backup channel",
    body: "Try each one. SMS gets blocked for high-risk asks because a SIM-swap could intercept it — the others can't be faked.",
    placement: "top",
  },
  {
    selector: "[data-tour='glossary']",
    title: "6. Glossary tips",
    body: (
      <>
        Anywhere you see a <span className="underline decoration-dotted decoration-amber-glow/60">dotted underline</span> with a small{" "}
        <span className="inline-grid h-3.5 w-3.5 place-items-center rounded-full border border-amber-glow/60 text-[8px] text-amber-glow">?</span>,
        click it for a plain-English definition. They appear all over the page.
      </>
    ),
    placement: "bottom",
  },
  {
    selector: "[data-tour='nav']",
    title: "7. Explore the rest",
    body: "Use the top nav to jump to how it works, the comparison matrix, the 'Phone hacked?' deep dive, pricing, and the FAQ.",
    placement: "bottom",
  },
];

function Index() {
  const [tourOpen, setTourOpen] = useState(false);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("ceo");
  const scenario = SCENARIOS[scenarioKey];

  const [triggered, setTriggered] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [challengeActive, setChallengeActive] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [callElapsed, setCallElapsed] = useState(0);
  const [callAnswered, setCallAnswered] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const callPlayerRef = useRef<ScamCallPlayerHandle>(null);

  useEffect(() => {
    if (!callAnswered) return;
    const i = setInterval(() => setCallElapsed((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [callAnswered]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reset = () => {
    clearTimers();
    callPlayerRef.current?.stop();
    setTriggered(false);
    setVisibleLines(0);
    setChallengeActive(false);
    setVerdict("idle");
    setCallElapsed(0);
    setCallAnswered(false);
    setAutoPlaying(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("airlock:stop-call"));
    }
  };

  const playIncomingCall = () => {
    setCallAnswered(true);
    void callPlayerRef.current?.play();
  };

  const stopIncomingCall = () => {
    setCallAnswered(false);
    callPlayerRef.current?.stop();
  };

  const trigger = () => {
    if (triggered) return;
    setTriggered(true);
    scenario.stream.forEach((_, idx) => {
      timers.current.push(setTimeout(() => setVisibleLines(idx + 1), 600 + idx * 800));
    });
    timers.current.push(
      setTimeout(() => setChallengeActive(true), 600 + scenario.stream.length * 800 + 400),
    );
  };

  const autoPlay = () => {
    reset();
    setAutoPlaying(true);
    // Authentic in doctor scenario, deepfake in the two attack scenarios.
    const finalVerdict: Verdict = scenarioKey === "doctor" ? "verified" : "deepfake";
    // Kick off the realistic AI voice-clone playback alongside the simulation
    playIncomingCall();
    timers.current.push(setTimeout(() => {
      setTriggered(true);
      scenario.stream.forEach((_, idx) => {
        timers.current.push(setTimeout(() => setVisibleLines(idx + 1), 400 + idx * 700));
      });
      timers.current.push(setTimeout(() => setChallengeActive(true), 400 + scenario.stream.length * 700 + 300));
      timers.current.push(setTimeout(() => setVerdict(finalVerdict), 400 + scenario.stream.length * 700 + 1600));
      // Reset is now driven by the airlock:call-ended event from the player so
      // the demo stays on screen until the audio actually finishes.
    }, 80));
  };

  // Reset the sim once the voice-clone call finishes (or after a hard cap).
  useEffect(() => {
    if (!autoPlaying) return;
    const onEnded = () => {
      const t = setTimeout(() => reset(), 3500); // linger so judges read the verdict
      timers.current.push(t);
    };
    // Safety cap — if the player never emits (e.g. network failure), still reset.
    const cap = setTimeout(() => reset(), 60_000);
    timers.current.push(cap);
    window.addEventListener("airlock:call-ended", onEnded);
    return () => window.removeEventListener("airlock:call-ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaying, scenarioKey]);

  // Reset sim when scenario changes
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [scenarioKey]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative min-h-screen pt-16">
      {/* Cinematic backdrop: animated aurora + soft grid */}
      <div className="fixed inset-0 aurora-bg pointer-events-none -z-20 opacity-70" />
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />

      <header className="fixed top-0 left-0 w-full z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/45">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <a href="#top" className="group flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 transition-ui group-hover:scale-105"
                 style={{ background: "var(--gradient-cosmic)", boxShadow: "var(--shadow-glow-magenta)" }}>
              <Lock className="h-4 w-4 text-background" />
              <span className="absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "var(--gradient-aurora)", filter: "blur(14px)", zIndex: -1 }} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold tracking-tight">
                AIRLOCK<span className="gradient-text">/0</span>
              </h1>
              <p className="hidden text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
                Out-of-Band Identity Gateway
              </p>
            </div>
          </a>
          <div data-tour="nav"><SectionNav /></div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground lg:flex">
              <span className="h-2 w-2 rounded-full bg-vivid-green animate-blink" /> LIVE
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10 mx-auto max-w-7xl px-6 pb-20 [&_section[id]]:scroll-mt-32 [&_div[id]]:scroll-mt-32">

        {/* HERO STRIP */}
        <HeroStrip />

        <div id="demo" />

        <Reveal className="mt-16 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-glow">
            // LIVE SIMULATION ENVIRONMENT
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            A trusted voice is calling.<br />
            The voice is perfect.{" "}
            <span className="gradient-text animate-gradient">It's not them.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Pick a scenario and watch a single text message collapse a{" "}
            <span data-tour="glossary"><Term label="Voice forgery" definition="Scammers feed a few seconds of someone's real voice — pulled from a voicemail, Instagram reel, TikTok, or podcast — into off-the-shelf voice generators to impersonate them on a live call.">scammer-built voice forgery</Term></span>{" "}
            attack into a verified hang-up — in under two seconds, across an{" "}
            <Term label="Independent Data Pathway" definition="A separate network route (e.g. cellular SMS) that doesn't share infrastructure with the call being attacked, so a compromised line can't tamper with the verification.">independent data pathway</Term>.
          </p>
        </Reveal>

        {/* SCENARIO + AUTOPLAY */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div data-tour="scenario-selector">
            <ScenarioSelector value={scenarioKey} onChange={setScenarioKey} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setTourOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> Take the tour
            </button>
            <button
              data-tour="autoplay"
              onClick={autoPlay}
              disabled={autoPlaying}
              className="inline-flex items-center gap-2 rounded-md border border-amber-glow/40 bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-glow transition hover:bg-surface-elevated disabled:opacity-50 glow-amber"
            >
              <Play className="h-3.5 w-3.5" /> {autoPlaying ? "Playing…" : "Auto-Play Demo"}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-surface-elevated"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.05fr)_minmax(320px,1fr)]">
          {/* COLUMN 1 */}
          <section className="relative" data-tour="phone">
            <ColumnHeader index="01" title="Incoming Threat" subtitle="Active phone line — compromised channel" tone="crimson" />
            <div className="relative">
              <PhoneMock
                callElapsed={fmt(callElapsed)}
                scenario={scenario}
                onAnswer={playIncomingCall}
                onDecline={stopIncomingCall}
                gaugeMode={
                  verdict === "deepfake"
                    ? "danger"
                    : verdict === "verified"
                    ? "safe"
                    : triggered
                    ? "analyzing"
                    : "idle"
                }
              />

              <div className="mt-4">
                <ScamCallPlayer ref={callPlayerRef} scenarioKey={scenarioKey} />
              </div>

              {verdict === "deepfake" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/85 p-4 backdrop-blur-sm animate-stream-in">
                  <div className="w-full rounded-xl border-2 border-crimson bg-surface p-5 glow-crimson">
                    <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-crimson-glow">
                      <ShieldAlert className="h-4 w-4" /> Critical · Action Required
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight text-crimson-glow">
                      🚨 STOP! Deepfake fraud isolated.
                    </h3>
                    <p className="mt-2 text-base font-semibold">HANG UP IMMEDIATELY.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The true owner confirmed they are{" "}
                      <span className="text-foreground font-semibold">not on the line</span>. The AI exploitation attempt has been successfully blocked.
                    </p>
                    <button
                      onClick={reset}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider hover:bg-surface-elevated"
                    >
                      <PhoneOff className="h-4 w-4" /> Reset Simulator
                    </button>
                  </div>
                </div>
              )}
              {verdict === "verified" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/85 p-4 backdrop-blur-sm animate-stream-in">
                  <div className="w-full rounded-xl border-2 border-vivid-green bg-surface p-5 glow-green">
                    <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vivid-green-glow">
                      <ShieldCheck className="h-4 w-4" /> Verified · Pathway Independent
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight text-vivid-green-glow">
                      ✅ Verified Secure
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Identity validated over independent data pathway. You may proceed with the call.
                    </p>
                    <button
                      onClick={reset}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider hover:bg-surface-elevated"
                    >
                      Reset Simulator
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 2 */}
          <section data-tour="stream">
            <ColumnHeader index="02" title="Text Trigger" subtitle="Recipient sends one character" tone="amber" />
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Frictionless Trigger</span>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-amber-glow">
                  SMS · Gateway
                </span>
              </div>

              <div className="rounded-lg bg-background/50 p-3">
                <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="min-w-0 truncate">To: AirLock Gateway</span>
                  <span className="shrink-0 font-mono">+1 (555) GUARD-00</span>
                </div>

                <div className="min-h-[64px] space-y-2">
                  {triggered && (
                    <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-amber-glow px-3 py-2 text-sm font-medium text-primary-foreground animate-stream-in">
                      💬 ?
                    </div>
                  )}
                </div>

                <button
                  onClick={trigger}
                  disabled={triggered}
                  className="mt-3 w-full rounded-md bg-amber-glow px-3 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 glow-amber sm:text-sm"
                >
                  {triggered ? "Trigger sent →" : "Text '?' to AirLock"}
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-border bg-background/70 p-3 font-mono text-[11px] leading-relaxed">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Radio className="h-3 w-3" /> backend.stream
                </div>
                <div className="min-h-[78px] space-y-1">
                  {scenario.stream.slice(0, visibleLines).map((l) => (
                    <div
                      key={l.id}
                      className="break-words animate-stream-in"
                      style={{
                        color:
                          l.tone === "gateway"
                            ? "var(--amber-glow)"
                            : l.tone === "context"
                            ? "var(--vivid-green-glow)"
                            : "var(--foreground)",
                      }}
                    >
                      {l.text}
                    </div>
                  ))}
                  {triggered && visibleLines < scenario.stream.length && (
                    <span className="inline-block h-3 w-2 bg-amber-glow animate-blink" />
                  )}
                </div>
                {triggered && visibleLines >= scenario.stream.length && (
                  <div className="mt-3 border-t border-border/60 pt-2">
                    <div className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Backup channels armed
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["Hardware key", "AirLock app", "Telegram/Signal", "SMS"].map((c, i) => (
                        <span
                          key={c}
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${
                            i === 0
                              ? "border-vivid-green/40 bg-vivid-green/10 text-vivid-green"
                              : "border-border/60 bg-background/40 text-muted-foreground"
                          }`}
                        >
                          {i === 0 ? "✓ " : ""}{c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Token delivered to highest-trust channel reachable. SIM-swap on the phone number does not intercept.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </section>

          {/* COLUMN 3 */}
          <section>
            <ColumnHeader index="03" title="Owner's Real Device" subtitle="Out-of-band — physically isolated" tone="amber" />
            <DeviceValidationPanel
              scenario={scenario}
              challengeActive={challengeActive && verdict === "idle"}
              onYes={() => setVerdict("verified")}
              onNo={() => setVerdict("deepfake")}
            />
          </section>
        </div>

        {/* COUNTER-SIM */}
        <CounterSimulation />

        {/* METRICS TICKER */}
        <MetricsTicker />

        {/* TRUST CIRCLE */}
        <TrustCircle scenario={scenario} />

        {/* PERSONAS */}
        <div id="personas"><PersonaTabs /></div>

        {/* COMPARISON */}
        <div id="compare"><ScannerComparison /></div>
        <div id="compare-matrix"><ComparisonMatrix /></div>

        {/* PHONE-COMPROMISE / SIM-SWAP DEFENSE */}
        <div id="phone-hacked"><PhoneCompromiseDefense /></div>

        {/* NOVEL MECHANICS */}
        <NovelMechanics />

        {/* ROI CALC */}
        <div id="roi"><RoiCalculator /></div>

        {/* ONBOARDING */}
        <OnboardingSteps />

        {/* HOW IT WORKS */}
        <HowItWorks />

        {/* WHY NOW — big stat band */}
        <WhyNowStatBand />

        {/* PRICING */}
        <div id="pricing"><PricingTiers /></div>

        {/* WHY NOW (detailed) */}
        <div id="why"><WhyNow /></div>

        {/* FAQ */}
        <FaqAccordion />


        {/* EDGE BREAKDOWN */}
        <section className="mt-16 grid gap-5 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
              <ShieldAlert className="h-4 w-4" /> The Problem with Traditional Scanners
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              Analyzing audio streams over cellular lines is{" "}
              <span className="text-foreground">slow and inaccurate</span> against frontier AI models.
              By the time a scanner returns a confidence score, the wire transfer is already gone.
            </p>
          </article>
          <article className="rounded-xl border border-amber-glow/40 bg-surface p-6 glow-amber">
            <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-glow">
              <Zap className="h-4 w-4" /> The AirLock Zero Paradigm
            </div>
            <p className="text-base leading-relaxed">
              We <span className="text-amber-glow font-semibold">bypass the audio channel completely</span>.
              By lowering the defense barrier to a single text message trigger, regular people can deploy
              un-hackable out-of-band authentication in{" "}
              <span className="text-amber-glow font-semibold">under two seconds</span>.
            </p>
          </article>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>© AirLock Zero · Identity Gateway Edge Network</span>
          <span>Latency budget: 1.8s · TLS 1.3 · FIPS-140-3</span>
        </footer>
      </main>
      <GuidedTour open={tourOpen} steps={TOUR_STEPS} onClose={() => setTourOpen(false)} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Hero strip
// ──────────────────────────────────────────────────────────────
function HeroStrip() {
  return (
    <Stagger className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <Reveal>
        <motion.article
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="group relative overflow-hidden rounded-3xl border border-crimson/25 p-7 glass"
        >
          {/* Decorative gradient orb */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: "radial-gradient(closest-side, rgba(255,91,107,0.45), transparent)" }}
          />
          <div className="relative mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-crimson-glow">
            <Quote className="h-3.5 w-3.5" /> Anonymized victim · case file #DF-2401
          </div>
          <p className="relative font-display text-2xl font-semibold leading-[1.25] sm:text-[1.7rem]">
            "They sounded exactly like my son. He said he was arrested and crying.
            I wired <span className="gradient-text">$18,400</span> before I realized
            he was asleep in his dorm."
          </p>
          <p className="relative mt-4 text-sm text-muted-foreground">
            — Eleanor R., 74 · Ohio · reported to FTC, March 2024
          </p>
          <p className="relative mt-5 border-t border-border/60 pt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Impersonation scams cost Americans <span className="text-foreground">$2.7B in 2024</span> —{" "}
            <Term label="FTC" definition="U.S. Federal Trade Commission — the consumer-protection agency that tracks fraud. Their Consumer Sentinel database is the source of these scam-loss figures.">FTC</Term>{" "}
            Consumer Sentinel
          </p>
        </motion.article>
      </Reveal>
      <Stagger className="grid grid-cols-1 gap-3 self-start sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3" step={0.08}>
        <Reveal><StatTile big="1,400%" label="YoY growth in deepfake fraud reports" tone="crimson" /></Reveal>
        <Reveal><StatTile big="<3 sec" label="of stolen audio needed to forge a voice" tone="amber" /></Reveal>
        <Reveal><StatTile big="68%" label="of voice-fraud victims are over 60" tone="magenta" /></Reveal>
      </Stagger>
    </Stagger>
  );
}

function StatTile({ big, label, tone }: { big: string; label: string; tone: "amber" | "crimson" | "magenta" }) {
  const color =
    tone === "crimson" ? "var(--crimson-glow)" :
    tone === "magenta" ? "var(--magenta-glow)" :
    "var(--amber-glow)";
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative min-h-[6.5rem] overflow-hidden rounded-2xl border border-border/60 p-5 transition-ui glass"
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div
        className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl lg:text-3xl xl:text-4xl"
        style={{ color }}
      >
        {big}
      </div>
      <div className="mt-2 text-[11px] leading-snug text-muted-foreground">{label}</div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// Scenario selector
// ──────────────────────────────────────────────────────────────
function ScenarioSelector({
  value,
  onChange,
}: {
  value: ScenarioKey;
  onChange: (v: ScenarioKey) => void;
}) {
  const items: { key: ScenarioKey; label: string; Icon: typeof Users }[] = [
    { key: "ceo", label: "CEO Wire Fraud", Icon: Building2 },
    { key: "bankchange", label: "Vendor Bank-Change", Icon: TrendingUp },
    { key: "itreset", label: "IT Password Reset", Icon: KeyRound },
    { key: "grandparent", label: "Grandparent Scam", Icon: Users },
    { key: "doctor", label: "Doctor's Office", Icon: Stethoscope },
  ];
  return (
    <div className="inline-flex flex-wrap rounded-2xl border border-border/60 p-1 glass">
      {items.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-xs uppercase tracking-wider transition-ui ${
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
            style={
              active
                ? { background: "var(--gradient-cosmic)", boxShadow: "var(--shadow-glow-magenta)" }
                : undefined
            }
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Column header
// ──────────────────────────────────────────────────────────────
function ColumnHeader({
  index,
  title,
  subtitle,
  tone,
}: {
  index: string;
  title: string;
  subtitle: string;
  tone: "amber" | "crimson";
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="font-mono text-xs font-bold"
        style={{ color: tone === "crimson" ? "var(--crimson-glow)" : "var(--amber-glow)" }}
      >
        {index}
      </span>
      <div className="min-w-0">
        <h3 className="truncate font-display text-sm font-bold uppercase tracking-wider">{title}</h3>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="ml-auto h-px flex-1 bg-border" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Phone mock
// ──────────────────────────────────────────────────────────────
function PhoneMock({
  callElapsed,
  scenario,
  onAnswer,
  onDecline,
  gaugeMode,
}: {
  callElapsed: string;
  scenario: Scenario;
  onAnswer: () => void;
  onDecline: () => void;
  gaugeMode: GaugeMode;
}) {
  const ringColor =
    gaugeMode === "danger"
      ? "border-crimson"
      : gaugeMode === "safe"
      ? "border-vivid-green"
      : gaugeMode === "analyzing"
      ? "border-amber-glow"
      : "border-crimson";
  return (
    <div className="relative mx-auto w-full max-w-[320px] rounded-[2rem] border border-border bg-surface-elevated p-3 shadow-2xl">
      <div className="rounded-[1.5rem] bg-background p-5 pt-8">
        <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>9:41</span>
          <span>● ● ● ●</span>
        </div>
        <div className="mt-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow animate-blink">
            ▲ INCOMING · ENCRYPTED
          </p>
          <div className={`relative mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full border-2 ${ringColor} animate-pulse-ring`}>
            <div className="grid h-20 w-20 place-items-center rounded-full bg-crimson/20 text-xl font-bold text-crimson-glow">
              {scenario.initials}
            </div>
          </div>
          <p className="mt-4 truncate text-lg font-bold sm:text-xl">{scenario.callerName}</p>
          <p className="truncate text-xs text-muted-foreground">{scenario.callerTitle}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-crimson-glow">
            ⚠ Voice forged from stolen audio
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{callElapsed}</p>
        </div>


        <div className="mt-6 flex items-center justify-around">
          <button onClick={onDecline} className="grid h-12 w-12 place-items-center rounded-full bg-crimson text-primary-foreground shadow-lg shadow-crimson/40 transition hover:brightness-110" aria-label="decline">
            <PhoneOff className="h-5 w-5" />
          </button>
          <button onClick={onAnswer} className="grid h-12 w-12 place-items-center rounded-full bg-vivid-green text-background shadow-lg transition hover:brightness-110 animate-pulse" aria-label="answer and hear the forged voice">
            <Phone className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Tap <span className="text-vivid-green-glow">answer</span> to hear the forged voice
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Device validation
// ──────────────────────────────────────────────────────────────
type ChannelKey = "hwkey" | "app" | "telegram" | "sms";

const CHANNELS: { key: ChannelKey; label: string; tag: string; icon: typeof KeyRound }[] = [
  { key: "hwkey", label: "Hardware key", tag: "Tier 1", icon: KeyRound },
  { key: "app", label: "AirLock app", tag: "Tier 2", icon: Smartphone },
  { key: "telegram", label: "Telegram/Signal", tag: "Tier 3", icon: Send },
  { key: "sms", label: "SMS", tag: "Tier 4", icon: MessageSquare },
];

// Scenarios that are too high-risk for SMS fallback
const HIGH_RISK: Record<string, boolean> = {
  ceo: true,
  bankchange: true,
  itreset: true,
  grandparent: true,
  doctor: false,
};

function DeviceValidationPanel({
  scenario,
  challengeActive,
  onYes,
  onNo,
}: {
  scenario: Scenario;
  challengeActive: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  const [channel, setChannel] = useState<ChannelKey>("app");
  const blocked = channel === "sms" && HIGH_RISK[scenario.key];

  // Channel-specific framing for the device line
  const deviceLine =
    channel === "hwkey"
      ? "yubikey.5c-nano · USB-C present"
      : channel === "app"
        ? "airlock.app · device-attested"
        : channel === "telegram"
          ? "telegram.bot · @AirLockVerify"
          : "sms.fallback · degraded mode";

  const channelHeadline =
    channel === "hwkey"
      ? "Touch your security key to sign"
      : channel === "app"
        ? "Face ID to release the Truth-Token"
        : channel === "telegram"
          ? "Reply in your private AirLock chat"
          : "Reply Y / N to verify (degraded)";

  const channelSub =
    channel === "hwkey"
      ? "Physical key sign-off — a SIM-swap or hacked phone can't fake it."
      : channel === "app"
        ? "Face ID / fingerprint on your real phone — SIM-swaps can't intercept it."
        : channel === "telegram"
          ? "Sent to your Telegram/Signal account — tied to your login, not your number."
          : "Plain text message — only safe for low-risk approvals.";

  return (
    <div className="relative rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{deviceLine}</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-vivid-green animate-blink" /> ONLINE
        </span>
      </div>

      {/* Channel selector */}
      <div data-tour="channel-selector" className="mt-3 grid grid-cols-4 gap-1.5">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const isActive = channel === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setChannel(c.key)}
              className={`flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 font-mono text-[9px] uppercase tracking-wider transition ${
                isActive
                  ? "border-amber-glow/60 bg-amber-glow/10 text-amber-glow"
                  : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
              }`}
              title={`${c.tag} · ${c.label}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-background/50 p-4">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>
            HW ·{" "}
            <Term label="Secure Element" definition="A tamper-resistant chip inside your phone (Apple Secure Enclave / Google Titan M2) that stores cryptographic keys. Even if the OS is compromised, the chip itself can't be read or copied.">
              Secure Element
            </Term>
          </span>
          <span>independent path · {CHANNELS.find((c) => c.key === channel)?.tag}</span>
        </div>

        {!challengeActive ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border border-border bg-surface-elevated">
              <Radio className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Status: Listening for challenges
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">{channelSub}</p>
          </div>
        ) : blocked ? (
          <div className="animate-stream-in py-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-crimson-glow">
              <ShieldAlert className="h-3.5 w-3.5 animate-blink" /> Channel blocked
            </div>
            <p className="text-sm leading-snug text-foreground">
              SMS is a tier-4 fallback. This challenge involves wire / credential / bank-change
              risk — AirLock refuses to deliver the Truth-Token over an un-bound channel a
              SIM-swap could intercept.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Auto-escalating to tier 2 (AirLock app) →
            </p>
            <button
              onClick={() => setChannel("app")}
              className="mt-3 w-full rounded-md border border-amber-glow/60 bg-amber-glow/10 px-3 py-3 font-mono text-xs font-bold uppercase tracking-wider text-amber-glow transition hover:bg-amber-glow/20"
            >
              Escalate to AirLock app
            </button>
          </div>
        ) : (
          <div className="animate-stream-in py-3">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-crimson-glow">
              <ShieldAlert className="h-3.5 w-3.5 animate-blink" /> {channelHeadline}
            </div>
            <p className="text-base font-semibold leading-snug">{scenario.challenge}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              <Term label="Truth-Token" definition="A one-time cryptographic challenge tied to a specific caller, request type, and amount. It can't be reused, replayed, or phished — and it expires in 60 seconds.">
                Truth-token
              </Term>{" "}
              bound to context · {channelSub}
            </p>

            {/* Channel-specific affordance */}
            {channel === "hwkey" && (
              <div className="mt-4 flex items-center justify-center gap-3 rounded-md border border-vivid-green/30 bg-vivid-green/5 px-3 py-3">
                <KeyRound className="h-5 w-5 animate-blink text-vivid-green" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-vivid-green">
                  Awaiting key tap…
                </span>
              </div>
            )}
            {channel === "app" && (
              <div className="mt-4 flex items-center justify-center gap-3 rounded-md border border-amber-glow/30 bg-amber-glow/5 px-3 py-3">
                <Fingerprint className="h-5 w-5 animate-blink text-amber-glow" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-amber-glow">
                  Awaiting biometric…
                </span>
              </div>
            )}
            {channel === "telegram" && (
              <div className="mt-3 space-y-1 rounded-md border border-border bg-background/40 px-3 py-2 font-mono text-[11px]">
                <div className="text-muted-foreground">@AirLockVerify · bot</div>
                <div className="text-foreground">Is this challenge yours? (Y / N)</div>
              </div>
            )}
            {channel === "sms" && (
              <div className="mt-3 rounded-md border border-border bg-background/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                AirLock: Verify call? Reply Y to approve, N to flag deepfake. (low-risk only)
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={onYes}
                className="rounded-md bg-vivid-green px-3 py-4 font-mono text-sm font-bold uppercase tracking-wider text-background transition hover:brightness-110 glow-green"
              >
                {channel === "hwkey"
                  ? "✓ Tap key"
                  : channel === "app"
                    ? "✓ Face ID"
                    : channel === "telegram"
                      ? "✓ Reply Y"
                      : "✓ Reply Y"}
              </button>
              <button
                onClick={onNo}
                className="rounded-md bg-crimson px-3 py-4 font-mono text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 glow-crimson"
              >
                ✕ Deepfake!
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wider">
        <div className="rounded border border-border bg-background/40 px-2 py-1.5 text-center text-muted-foreground">
          <div className="text-foreground">
            <Term label="AES-256" definition="The encryption standard used by banks and governments — a 256-bit key would take billions of years to brute-force.">AES-256</Term>
          </div>
          <div>cipher</div>
        </div>
        <div className="rounded border border-border bg-background/40 px-2 py-1.5 text-center text-muted-foreground">
          <div className="text-foreground">
            {channel === "hwkey" ? "USB-C" : channel === "app" ? "Push" : channel === "telegram" ? "MTProto" : "GSM"}
          </div>
          <div>uplink</div>
        </div>
        <div className="rounded border border-border bg-background/40 px-2 py-1.5 text-center text-muted-foreground">
          <div className={channel === "sms" ? "text-crimson-glow" : "text-vivid-green"}>
            {channel === "sms" ? "LOW" : "HIGH"}
          </div>
          <div>trust</div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Verdict console
// ──────────────────────────────────────────────────────────────
function VerdictConsole({
  scenario,
  verdict,
  triggered,
  challengeActive,
}: {
  scenario: Scenario;
  verdict: Verdict;
  triggered: boolean;
  challengeActive: boolean;
}) {
  const events: { t: string; label: string; tone: string }[] = [];
  if (triggered) events.push({ t: "T+0.0s", label: "Trigger received from authorized user", tone: "amber" });
  if (triggered) events.push({ t: "T+0.6s", label: "Context engine resolved", tone: "green" });
  if (triggered) events.push({ t: "T+1.2s", label: `Truth-token issued for ${scenario.label}`, tone: "amber" });
  if (challengeActive) events.push({ t: "T+1.8s", label: "Hardware ping awaiting human verdict", tone: "amber" });
  if (verdict === "verified") events.push({ t: "T+3.1s", label: "VERIFIED — independent pathway match", tone: "green" });
  if (verdict === "deepfake") events.push({ t: "T+3.1s", label: "DEEPFAKE ISOLATED — call quarantined", tone: "crimson" });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>verdict.ledger</span>
        <span>append-only</span>
      </div>

      <div className="mt-3 rounded-lg bg-background/60 p-3 font-mono text-[11px]">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
          {events.length === 0 ? (
            <div className="col-span-2 py-10 text-center text-muted-foreground">
              <p className="uppercase tracking-widest">// awaiting trigger</p>
              <p className="mt-1 normal-case text-muted-foreground/60">No events recorded.</p>
            </div>
          ) : (
            events.map((e, i) => (
              <div key={i} className="contents animate-stream-in">
                <span className="text-muted-foreground">{e.t}</span>
                <span
                  style={{
                    color:
                      e.tone === "green"
                        ? "var(--vivid-green-glow)"
                        : e.tone === "crimson"
                        ? "var(--crimson-glow)"
                        : "var(--amber-glow)",
                  }}
                >
                  ▸ {e.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Median verdict" value="1.84s" tone="amber" />
        <Stat label="Bypass rate" value="0.00%" tone="green" />
        <Stat label="Channels used" value="2 / 2" tone="amber" />
        <Stat label="Audio analyzed" value="None" tone="green" />
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
        <p className="font-mono uppercase tracking-wider text-foreground">Why this works</p>
        <p className="mt-1">
          The attacker controls the audio. They never control the second device. Two pathways, one truth.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className="mt-1 font-display text-xl font-bold"
        style={{ color: tone === "green" ? "var(--vivid-green-glow)" : "var(--amber-glow)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Counter sim
// ──────────────────────────────────────────────────────────────
function CounterSimulation() {
  const without = [
    { t: "0:00", label: "Call answered" },
    { t: "0:30", label: "Wire instructions taken" },
    { t: "2:00", label: "Transfer sent" },
    { t: "2:01", label: "$42,000 lost · unrecoverable", tone: "crimson" as const },
  ];
  const withAir = [
    { t: "0:00", label: "Call answered" },
    { t: "0:02", label: "‘?’ texted to gateway" },
    { t: "0:03", label: "Out-of-band ping sent" },
    { t: "0:04", label: "Deepfake isolated · $0 lost", tone: "green" as const },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// Side-by-side outcome" title="Same call. Two clocks. Two endings." />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <TimelineCard title="Without AirLock" rows={without} accent="crimson" />
        <TimelineCard title="With AirLock Zero" rows={withAir} accent="green" />
      </div>
    </section>
  );
}

function TimelineCard({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: { t: string; label: string; tone?: "crimson" | "green" }[];
  accent: "crimson" | "green";
}) {
  const border = accent === "crimson" ? "border-crimson/40 glow-crimson" : "border-vivid-green/40 glow-green";
  const head = accent === "crimson" ? "text-crimson-glow" : "text-vivid-green-glow";
  return (
    <article className={`rounded-xl border bg-surface p-5 ${border}`}>
      <h3 className={`font-mono text-xs uppercase tracking-[0.2em] ${head}`}>{title}</h3>
      <ul className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[64px_1fr] items-baseline gap-3">
            <span className="font-mono text-xs text-muted-foreground">{r.t}</span>
            <span
              className="text-sm"
              style={{
                color:
                  r.tone === "crimson"
                    ? "var(--crimson-glow)"
                    : r.tone === "green"
                    ? "var(--vivid-green-glow)"
                    : undefined,
                fontWeight: r.tone ? 700 : 400,
              }}
            >
              {r.label}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────
// Metrics ticker
// ──────────────────────────────────────────────────────────────
function MetricsTicker() {
  const targets = useMemo(
    () => [
      { label: "Attacks blocked today", value: 3147, format: (n: number) => n.toLocaleString() },
      { label: "$ saved this week", value: 1284000, format: (n: number) => `$${Math.round(n / 1000).toLocaleString()}K` },
      { label: "Median verdict (ms)", value: 1840, format: (n: number) => `${n.toLocaleString()}` },
      { label: "Verified families", value: 12480, format: (n: number) => n.toLocaleString() },
    ],
    [],
  );
  const [vals, setVals] = useState(targets.map(() => 0));

  useEffect(() => {
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVals(targets.map((t) => Math.round(t.value * eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets]);

  return (
    <section className="mt-12 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-glow">
        <Sparkles className="h-3.5 w-3.5" /> Live network · last 24h
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {targets.map((t, i) => (
          <div key={t.label}>
            <div className="font-display text-2xl font-bold text-amber-glow sm:text-3xl">
              {t.format(vals[i])}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Trust circle
// ──────────────────────────────────────────────────────────────
function TrustCircle({ scenario }: { scenario: Scenario }) {
  const nodes = [
    { label: "Mom", angle: 0 },
    { label: scenario.trustEdge, angle: 72 },
    { label: "Bank Ops", angle: 144 },
    { label: "Dr. Lee", angle: 216 },
    { label: "Spouse", angle: 288 },
  ];
  const R = 110;
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// Context-aware identity engine" title="Personalized challenges, not generic OTPs." />
      <div className="mt-5 grid items-center gap-6 rounded-xl border border-border bg-surface p-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid place-items-center">
          <svg viewBox="-160 -160 320 320" className="h-72 w-72">
            {nodes.map((n, i) => {
              const x = R * Math.cos((n.angle * Math.PI) / 180);
              const y = R * Math.sin((n.angle * Math.PI) / 180);
              return (
                <g key={i}>
                  <line x1={0} y1={0} x2={x} y2={y} stroke="oklch(0.82 0.16 75 / 0.35)" strokeDasharray="3 3" />
                  <circle cx={x} cy={y} r={28} fill="oklch(0.2 0.014 250)" stroke="oklch(0.82 0.16 75 / 0.6)" />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="white" fontFamily="JetBrains Mono">
                    {n.label.length > 10 ? n.label.slice(0, 9) + "…" : n.label}
                  </text>
                </g>
              );
            })}
            <circle cx={0} cy={0} r={36} fill="oklch(0.82 0.16 75)" />
            <text x={0} y={4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="oklch(0.16 0.012 250)">
              SARAH
            </text>
          </svg>
        </div>
        <div>
          <p className="text-base leading-relaxed text-muted-foreground">
            The{" "}
            <Term label="Context-Aware Identity Engine" definition="A relationship graph (contacts, payroll, frequent doctors) that AirLock uses to send the right person a personalized challenge — not a generic '6-digit code' that an attacker could ask for.">
              <span className="text-amber-glow font-semibold">Context-Aware Identity Engine</span>
            </Term>{" "}
            maps
            who can plausibly ask Sarah for what. When a “CEO” calls about a wire, AirLock challenges{" "}
            <span className="text-foreground">Marcus specifically</span> — not a random OTP.
            Generic 2FA can't tell the difference. We can.
          </p>
          <ul className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
            <li>▸ Relationship graph built from contacts + payroll + EHR (opt-in).</li>
            <li>▸ Each challenge bound to caller identity, request type, and amount.</li>
            <li>▸ Token expires in 60s — no replay, no phishing.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Personas
// ──────────────────────────────────────────────────────────────
function PersonaTabs() {
  const personas = [
    {
      key: "family",
      label: "Family",
      Icon: Users,
      who: "Adult children of parents 65+",
      fear: "“Mom, it's me, I'm in jail” — a voice forged from a TikTok clip, asking for bail money.",
      flow: "Mom texts ‘?’ to AirLock. Real grandson's phone pings. He taps ‘No’. Mom hangs up.",
      price: "Family plan · $9/mo · 5 contacts",
    },
    {
      key: "smb",
      label: "Small Business",
      Icon: Building2,
      who: "10–200 person SMBs with finance ops",
      fear: "Cloned CEO calls finance ops at 4:55pm Friday asking for an urgent vendor wire.",
      flow: "Finance texts ‘?’. Real CEO's phone challenges with exact amount. CEO taps ‘No’. Wire blocked.",
      price: "SMB plan · $59/mo per seat · SSO + audit log",
    },
    {
      key: "law",
      label: "Law / Healthcare",
      Icon: Stethoscope,
      who: "Solo practices and clinics with PII",
      fear: "“Dr. Lee's office” calls a patient asking for SSN to ‘update insurance’.",
      flow: "Patient texts ‘?’. Clinic's verified device confirms or denies. SSN never leaves.",
      price: "Enterprise · contact · BAA + SIEM hooks",
    },
  ];
  const [active, setActive] = useState(0);
  const p = personas[active];
  const Icon = p.Icon;
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// Who buys this" title="Three buyers, one product." />
      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap gap-2">
          {personas.map((x, i) => {
            const I = x.Icon;
            const on = i === active;
            return (
              <button
                key={x.key}
                onClick={() => setActive(i)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider transition ${
                  on ? "bg-amber-glow text-primary-foreground glow-amber" : "bg-background/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <I className="h-3.5 w-3.5" /> {x.label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr]">
          <div className="grid h-20 w-20 place-items-center rounded-xl border border-amber-glow/40 bg-surface-elevated glow-amber">
            <Icon className="h-8 w-8 text-amber-glow" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Who</div>
              <div className="text-base font-semibold">{p.who}</div>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-crimson-glow">The fear</div>
              <div className="text-sm text-muted-foreground">{p.fear}</div>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-vivid-green-glow">AirLock flow</div>
              <div className="text-sm">{p.flow}</div>
            </div>
            <div className="font-mono text-xs text-amber-glow">{p.price}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Comparison matrix
// ──────────────────────────────────────────────────────────────
function ComparisonMatrix() {
  const rows = [
    ["Defense channel", "Out-of-band SMS + HW", "Audio analysis", "Audio analysis", "Verbal memory"],
    ["Verdict latency", "<2s", "8–15s", "5–10s", "Manual"],
    ["Setup friction", "Text ‘JOIN’", "Telco integration", "Enterprise SDK", "Must memorize"],
    ["Beats GPT-4o Voice", "yes", "degrades", "degrades", "social-eng."],
    ["Works for Grandma", "yes", "no", "no", "no"],
  ];
  const headers = ["", "AirLock Zero", "Pindrop", "Reality Defender", "Safe-words"];
  const cell = (v: string) => {
    if (v === "yes") return <Check className="mx-auto h-4 w-4 text-vivid-green-glow" />;
    if (v === "no") return <X className="mx-auto h-4 w-4 text-crimson-glow" />;
    return <span className="text-muted-foreground">{v}</span>;
  };
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// vs the field" title="Why scanners can't catch what we sidestep." />
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/40">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider ${
                    i === 1 ? "text-amber-glow" : "text-muted-foreground"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {r.map((v, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${j === 0 ? "font-mono text-xs uppercase tracking-wider text-muted-foreground" : "text-center"} ${
                      j === 1 ? "bg-amber-glow/5" : ""
                    }`}
                  >
                    {j === 0 ? v : cell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Novel mechanics
// ──────────────────────────────────────────────────────────────
function NovelMechanics() {
  const items = [
    {
      Icon: MessageSquare,
      title: "Single-char SMS trigger",
      body: "One character (‘?’) deploys protection. No app to install in a panic, no password to remember. Grandma-grade UX.",
    },
    {
      Icon: KeyRound,
      title: "Truth-token",
      body: "Cryptographic one-time challenge bound to caller, request type, and amount. Useless if intercepted, expires in 60s.",
    },
    {
      Icon: Cpu,
      title: "Hardware-bound verdict",
      body: "Verdict is signed inside the owner's Titan / Secure Enclave — impossible to spoof from another device, even with the SIM.",
    },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// What's new" title="Three mechanics, none of them exist together anywhere else." />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((x) => {
          const I = x.Icon;
          return (
            <article key={x.title} className="rounded-xl border border-amber-glow/25 bg-surface p-5">
              <I className="h-6 w-6 text-amber-glow" />
              <h3 className="mt-3 font-display text-lg font-bold">{x.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{x.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// ROI calculator
// ──────────────────────────────────────────────────────────────
function RoiCalculator() {
  const [team, setTeam] = useState(25);
  const [wire, setWire] = useState(48000);
  // FTC: ~1.2% of SMBs/yr hit by impersonation; expected loss = team * rate * wire * success
  const annualExposure = Math.round(team * 0.012 * wire * 0.45);
  const airlockCost = Math.round(team * 29 * 12);
  const protection = Math.max(0, annualExposure - airlockCost);
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// Pencil-test the ROI" title="Cost of one missed call vs cost of AirLock." />
      <div className="mt-5 grid gap-5 rounded-xl border border-border bg-surface p-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span>Team size</span>
              <span className="text-foreground">{team}</span>
            </div>
            <input
              type="range" min={1} max={500} value={team}
              onChange={(e) => setTeam(parseInt(e.target.value))}
              className="mt-2 w-full accent-[color:var(--amber-glow)]"
            />
          </div>
          <div>
            <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span>Typical wire size</span>
              <span className="text-foreground">${wire.toLocaleString()}</span>
            </div>
            <input
              type="range" min={1000} max={500000} step={1000} value={wire}
              onChange={(e) => setWire(parseInt(e.target.value))}
              className="mt-2 w-full accent-[color:var(--amber-glow)]"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Model: FTC Sentinel impersonation hit-rate (1.2%/yr) × wire size × 45% successful-transfer rate.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <RoiTile label="Annual deepfake exposure" value={`$${annualExposure.toLocaleString()}`} tone="crimson" />
          <RoiTile label="AirLock Zero cost / yr" value={`$${airlockCost.toLocaleString()}`} tone="amber" />
          <RoiTile label="Net protection delivered" value={`$${protection.toLocaleString()}`} tone="green" big />
        </div>
      </div>
    </section>
  );
}

function RoiTile({ label, value, tone, big = false }: { label: string; value: string; tone: "amber" | "crimson" | "green"; big?: boolean }) {
  const color =
    tone === "crimson" ? "var(--crimson-glow)" : tone === "green" ? "var(--vivid-green-glow)" : "var(--amber-glow)";
  const ring =
    tone === "crimson" ? "border-crimson/40" : tone === "green" ? "border-vivid-green/40 glow-green" : "border-amber-glow/30";
  return (
    <div className={`rounded-xl border bg-background/40 p-4 ${ring}`}>
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display font-bold ${big ? "text-3xl" : "text-2xl"}`} style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Onboarding
// ──────────────────────────────────────────────────────────────
function OnboardingSteps() {
  const steps = [
    { n: "01", title: "Text JOIN", body: "Text JOIN to the AirLock gateway number. No app download." },
    { n: "02", title: "Add 3 trusted contacts", body: "Reply with the people who might call you about money or medical info." },
    { n: "03", title: "Done", body: "Any time you're suspicious, just text ‘?’. Verifications run automatically." },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// 60-second setup" title="Onboard a 74-year-old in three text messages." />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.n} className="rounded-xl border border-border bg-surface p-5">
            <div className="font-mono text-2xl font-bold text-amber-glow">{s.n}</div>
            <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Pricing
// ──────────────────────────────────────────────────────────────
function PricingTiers() {
  const ACR: Record<string, { label: string; def: string }> = {
    SSO: { label: "SSO", def: "Single Sign-On — employees log in once with their company account (Google, Okta) instead of a separate password." },
    SIEM: { label: "SIEM", def: "Security Information & Event Management — the central dashboard where IT teams collect and review security alerts." },
    SOC: { label: "SOC", def: "Security Operations Center — the team or service that watches alerts 24/7." },
    BAA: { label: "BAA", def: "Business Associate Agreement — the HIPAA contract required when handling U.S. patient health data." },
    SLA: { label: "SLA", def: "Service Level Agreement — a contractual guarantee of uptime and response time." },
    CSM: { label: "CSM", def: "Customer Success Manager — a dedicated point of contact who helps you roll out the product." },
  };
  const renderFeature = (f: string) => {
    const parts = f.split(/(\bSSO\b|\bSIEM\b|\bSOC\b|\bBAA\b|\bSLA\b|\bCSM\b)/g);
    return parts.map((p, i) =>
      ACR[p] ? <Term key={i} label={ACR[p].label} definition={ACR[p].def}>{p}</Term> : <span key={i}>{p}</span>,
    );
  };
  const tiers = [
    {
      name: "Family",
      price: "$9",
      per: "/mo",
      tagline: "Safer calls for the people most targeted by voice scams.",
      benefits: [
        { tag: "Safer", text: "Blocks grandparent-style voice forgeries before money moves" },
        { tag: "Simpler", text: "One text — no app to teach a 74-year-old" },
        { tag: "Always-on", text: "24/7 SMS gateway, works on any flip-phone or smartphone" },
      ],
      features: ["Up to 5 trusted contacts", "SMS gateway", "Voice-forgery protection", "Email support"],
      cta: "Protect my family",
    },
    {
      name: "Small Business",
      price: "$59",
      per: "/seat / mo",
      tagline: "Stops wire-fraud, vendor-bank-change, and helpdesk vishing in <2s.",
      benefits: [
        { tag: "Faster", text: "Verdict in under 2 seconds — before the wire clears" },
        { tag: "Stronger", text: "Hardware-bound truth tokens; phishing-proof by design" },
        { tag: "Auditable", text: "Every verification logged to Slack, Teams, and your SIEM" },
      ],
      features: ["Unlimited contacts", "SSO + audit log", "Slack / Teams alerts", "Priority support"],
      cta: "Start SMB trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Contact",
      per: "",
      tagline: "The seatbelt that lets your business safely deploy frontier AI.",
      benefits: [
        { tag: "Compliant", text: "SOC 2, HIPAA BAA, and on-prem gateway options" },
        { tag: "Resilient", text: "99.99% SLA on independent cellular pathway" },
        { tag: "Integrated", text: "Native SIEM/SOC hooks; dedicated CSM for rollout" },
      ],
      features: ["SIEM / SOC integration", "On-prem gateway option", "SLA + BAA", "Dedicated CSM"],
      cta: "Talk to sales",
    },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="// Pricing" title="Priced for grandparents and CFOs alike." />
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every plan delivers the same core promise: <span className="text-foreground">a verified hang-up in under two seconds</span>. What changes is who you're protecting and how deep it integrates.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <article
            key={t.name}
            className={`flex flex-col rounded-xl border bg-surface p-6 ${
              t.highlight ? "border-amber-glow/50 glow-amber" : "border-border"
            }`}
          >
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.per}</span>
            </div>
            <p className="mt-3 text-sm text-foreground/90">{t.tagline}</p>
            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {t.benefits.map((b) => (
                <li key={b.tag} className="flex items-start gap-2 text-[13px] leading-snug">
                  <span className="mt-0.5 shrink-0 rounded border border-amber-glow/40 bg-amber-glow/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-glow">
                    {b.tag}
                  </span>
                  <span className="text-muted-foreground">{b.text}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-[12px]">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vivid-green-glow" />
                  <span className="text-muted-foreground">{renderFeature(f)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2">
              <button
                className={`w-full rounded-md px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
                  t.highlight
                    ? "bg-amber-glow text-primary-foreground hover:brightness-110"
                    : "border border-border bg-background hover:bg-surface-elevated"
                }`}
              >
                {t.cta}
              </button>
              <PlanDetailsDrawer planName={t.name} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Why now
// ──────────────────────────────────────────────────────────────
function WhyNow() {
  const items = [
    { title: "Voice forgery went mainstream", body: "Scammers can now forge a recognizable voice from under 3 seconds of stolen audio — every public podcast, voicemail, or Instagram reel is enough source material." },
    { title: "Fraud volume exploded", body: "FTC: $2.7B lost to impersonation scams in 2024. AI-voice reports up 1,400% YoY. Banks are quietly absorbing the losses." },
    { title: "Regulators are moving", body: "FCC ruled AI-voice robocalls illegal under TCPA (2024). State AGs publishing guidance. Compliance demand is now." },
  ];
  return (
    <section className="mt-16 rounded-xl border border-amber-glow/25 bg-surface p-6">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-glow">
        <TrendingUp className="h-4 w-4" /> Why now
      </div>
      <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
        Three tailwinds, all happening at once.
      </h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {items.map((x) => (
          <div key={x.title}>
            <h3 className="font-display text-base font-bold text-amber-glow">{x.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{x.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Section header
// ──────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-glow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Phone-compromise / SIM-swap defense section
// ──────────────────────────────────────────────────────────────
function PhoneCompromiseDefense() {
  const threats: { title: React.ReactNode; body: React.ReactNode }[] = [
    {
      title: (
        <Term
          label="SIM-swap"
          definition="A scammer tricks the phone company into moving your number onto their SIM card. After that, any text codes or calls meant for you go to them instead."
        >
          SIM-swap
        </Term>
      ),
      body: (
        <>
          A scammer talks your phone carrier into handing your number to them. Every text
          code meant for you — including bank{" "}
          <Term
            label="2FA"
            definition="Two-Factor Authentication. The extra code you type after your password (usually sent by text) to prove it's really you."
          >
            2FA
          </Term>{" "}
          codes — now lands on their phone.
        </>
      ),
    },
    {
      title: (
        <Term
          label="SS7 interception"
          definition="SS7 is the global phone network that routes calls and texts between carriers. It has decades-old security holes that let attackers quietly read texts and listen to calls."
        >
          Text-message interception
        </Term>
      ),
      body: "Sophisticated attackers can quietly read your texts and re-route your calls without you touching anything. You'd never know it happened.",
    },
    {
      title: "Stolen or unlocked phone",
      body: "If someone watches you type your PIN and grabs the phone, every text code and pop-up notification is theirs.",
    },
  ];

  const tiers: {
    tier: number;
    name: React.ReactNode;
    tag: string;
    body: React.ReactNode;
    tone: "vivid" | "amber" | "muted";
  }[] = [
    {
      tier: 1,
      name: "Hardware security key",
      tag: "YubiKey · Titan · passkey",
      body: (
        <>
          A small physical key (USB or NFC) that signs the approval with a chip inside it. A
          SIM-swap can't touch it, and a thief without the actual key can't use it.
        </>
      ),
      tone: "vivid",
    },
    {
      tier: 2,
      name: "AirLock app + Face ID / fingerprint",
      tag: "Most users",
      body: (
        <>
          A push notification to the AirLock app, approved with your{" "}
          <Term
            label="Biometric"
            definition="Face ID or a fingerprint scan — proof that the actual owner of the phone is present, not just someone who knows the PIN."
          >
            face or fingerprint
          </Term>
          . The approval is tied to the specific phone, not the phone number — so a swapped SIM
          on a new phone receives nothing.
        </>
      ),
      tone: "vivid",
    },
    {
      tier: 3,
      name: "Telegram or Signal message",
      tag: "No app install needed",
      body: (
        <>
          A private message from an AirLock bot in an app you already use. Delivery is tied to
          your account login — not your phone number — so number-porting attacks can't grab it.
        </>
      ),
      tone: "amber",
    },
    {
      tier: 4,
      name: "Plain text message (SMS)",
      tag: "Low-risk only",
      body: (
        <>
          Last-resort fallback, only used when nothing better is reachable. AirLock refuses to
          send high-stakes approvals (wire transfers, password resets, vendor bank changes) over
          plain SMS because a SIM-swap could grab it.
        </>
      ),
      tone: "muted",
    },
  ];

  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="// What if the owner's phone gets hacked?"
        title="Approvals don't ride on plain text messages — so SIM-swaps don't break them."
      />
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        One phone can be lost, stolen, or hijacked at the phone-company level. AirLock keeps a
        ranked list of backup channels and sends the approval to the safest one that's
        currently reachable — so no single weak link (especially not your phone number) can be
        used to fake an approval.
      </p>

      {/* Threat row */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {threats.map((t, i) => (
          <article key={i} className="rounded-xl border border-crimson/25 bg-surface/60 p-4">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-crimson-glow">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> {t.title}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t.body}</p>
          </article>
        ))}
      </div>

      {/* Defense ladder */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-glow">
          <Lock className="h-4 w-4" /> Backup channels · safest one wins
        </div>
        <ol className="space-y-3">
          {tiers.map((t) => {
            const accent =
              t.tone === "vivid"
                ? "border-vivid-green/40 bg-vivid-green/5"
                : t.tone === "amber"
                  ? "border-amber-glow/40 bg-amber-glow/5"
                  : "border-border bg-background/40";
            const badge =
              t.tone === "vivid"
                ? "bg-vivid-green/20 text-vivid-green"
                : t.tone === "amber"
                  ? "bg-amber-glow/20 text-amber-glow"
                  : "bg-muted text-muted-foreground";
            return (
              <li key={t.tier} className={`rounded-lg border p-4 ${accent}`}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                    Option {t.tier}
                  </span>
                  <h3 className="font-display text-base font-semibold text-foreground">{t.name}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.tag}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t.body}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Why this beats SMS 2FA + enrollment */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-amber-glow/40 bg-surface p-5 glow-amber">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-glow">
            <KeyRound className="h-4 w-4" /> Why this is safer than text-message 2FA
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every approval is signed by a{" "}
            <Term
              label="Device-bound key"
              definition="A secret created and stored inside the phone's special security chip (Apple Secure Enclave or Google Titan). The secret never leaves the chip and can't be copied to a new SIM or another phone."
            >
              key locked inside your phone's security chip
            </Term>
            , expires in 90 seconds, and only releases after a fresh face or fingerprint check.
            A stolen text or a SIM-swap turns up nothing usable — there's no shared code to
            steal.
          </p>
        </article>
        <article className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-vivid-green">
            <Cpu className="h-4 w-4" /> Adding a new phone is locked down too
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A new phone can only be added after the owner approves it from an already-trusted
            device or hardware key kept offline. Even if a scammer SIM-swaps you, they still
            can't enroll their own phone — the phone company doesn't hold the keys, your
            existing devices do.
          </p>
        </article>
      </div>
    </section>
  );
}



// ──────────────────────────────────────────────────────────────
// Sticky section nav
// ──────────────────────────────────────────────────────────────
function SectionNav() {
  const items = [
    { id: "demo", label: "Demo?" },
    { id: "personas", label: "Who it's for?" },
    { id: "compare", label: "Compare?" },
    { id: "phone-hacked", label: "Phone hacked?" },
    { id: "roi", label: "ROI?" },
    { id: "how", label: "How?" },
    { id: "pricing", label: "Pricing?" },
    { id: "why", label: "Why now?" },
    { id: "faq", label: "FAQ?" },
  ];
  const [active, setActive] = useState<string>("demo");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };
  return (
    <nav className="flex flex-1 justify-center overflow-hidden">
      <ul className="flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-surface/60 p-1">
        {items.map((i) => {
          const isActive = active === i.id;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                onClick={(e) => onClick(e, i.id)}
                className={`block rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
                  isActive
                    ? "bg-amber-glow text-primary-foreground glow-amber"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {i.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────
// Plan details drawer — exactly what each subscription unlocks
// ──────────────────────────────────────────────────────────────
type PlanDetail = {
  pillars: { tag: string; headline: string; body: string }[];
  included: string[];
  limited: { label: string; value: string }[];
  notIncluded: string[];
};

const PLAN_DETAILS: Record<string, PlanDetail> = {
  Family: {
    pillars: [
      { tag: "Safer", headline: "Voice-forgery shield, on by default", body: "Every inbound call is rated against your loved one's voiceprint, and a single SMS challenge stops impostor wires before the money moves." },
      { tag: "Simpler", headline: "No app, no training", body: "Grandparents text one character (?) to a memorized number. That's the whole user manual. Works on any phone made in the last 20 years." },
      { tag: "Always-on", headline: "24/7 SMS gateway", body: "Independent cellular pathway means it works even if the home Wi-Fi, the laptop, or the bank app is down." },
    ],
    included: [
      "Up to 5 trusted contacts (grandkids, kids, spouse, doctor, bank)",
      "Unlimited voice-forgery scans per month",
      "SMS truth-token gateway (<2s verdict)",
      "Per-contact trust levels + 'verified caller' badges",
      "Safe-word fallback if the owner's phone is offline",
      "Email support, <24h response",
    ],
    limited: [
      { label: "Trusted contacts", value: "5 (extra: $2/mo each)" },
      { label: "Devices per contact", value: "2 (phone + tablet)" },
      { label: "History retention", value: "30 days of verification logs" },
    ],
    notIncluded: [
      "SSO / Okta / Google Workspace",
      "Slack / Teams / SIEM integrations",
      "Audit log export, HIPAA BAA, custom SLA",
      "Dedicated onboarding manager",
    ],
  },
  "Small Business": {
    pillars: [
      { tag: "Faster", headline: "Verdict in under 2 seconds", body: "Out-of-band SMS challenge returns a yes/no before a CFO finishes typing the wire amount. Every second saved is a fraud loss prevented." },
      { tag: "Stronger", headline: "Hardware-bound truth tokens", body: "Tokens are signed inside the executive's phone Secure Element. Phishing, SIM-swap, and replay attacks fail by construction — not by detection." },
      { tag: "Auditable", headline: "Every challenge logged", body: "Slack, Teams, and webhook delivery for every verification. Hand your auditor a clean trail; satisfy your cyber-insurance carrier on day one." },
    ],
    included: [
      "Unlimited protected contacts and unlimited verifications",
      "SSO via Google, Microsoft, Okta, or SAML 2.0",
      "Slack & Microsoft Teams real-time alert channels",
      "Webhooks + REST API for custom workflows",
      "Vendor bank-change & IT helpdesk scenario packs",
      "Role-based admin (Finance, IT, Executive Assistant)",
      "Priority chat support, <4h response, business hours",
      "90-day audit log retention with CSV export",
    ],
    limited: [
      { label: "Seats", value: "Per-seat pricing, volume discount at 25+" },
      { label: "SLA", value: "99.9% uptime, best-effort response" },
      { label: "Custom scenarios", value: "Up to 3 (Enterprise: unlimited)" },
    ],
    notIncluded: [
      "On-prem gateway / private cellular pathway",
      "Dedicated Customer Success Manager",
      "HIPAA BAA, FedRAMP, SOC 2 Type II attestation letter",
      "24/7 phone support with 15-min response SLA",
    ],
  },
  Enterprise: {
    pillars: [
      { tag: "Compliant", headline: "Built for regulated industries", body: "SOC 2 Type II, HIPAA BAA, GDPR DPA, and configurable data residency. Bring your CISO and your auditor — both will sign." },
      { tag: "Resilient", headline: "99.99% uptime SLA", body: "Active-active gateways across two independent cellular carriers. Financial penalties when we miss. We don't miss." },
      { tag: "Integrated", headline: "Lives inside your stack", body: "Native SIEM (Splunk, Sentinel, Datadog), SOAR playbooks, and an optional on-prem gateway that never leaves your VPC." },
    ],
    included: [
      "Everything in Small Business",
      "Splunk / Sentinel / Datadog / Chronicle SIEM connectors",
      "On-prem or private-cloud gateway option",
      "HIPAA BAA, SOC 2 Type II report, GDPR DPA",
      "Unlimited custom scenarios + scripted runbooks",
      "Dedicated CSM, named security engineer, quarterly review",
      "24/7 phone support, 15-minute response SLA",
      "Unlimited audit log retention with immutable WORM storage",
    ],
    limited: [
      { label: "SLA", value: "99.99% uptime with financial credits" },
      { label: "Data residency", value: "US, EU, UK, APAC selectable" },
      { label: "Pen-test access", value: "Twice-yearly, full report sharing" },
    ],
    notIncluded: [
      "Nothing — if you need it, we'll scope it.",
    ],
  },
};

function PlanDetailsDrawer({ planName }: { planName: string }) {
  const [open, setOpen] = useState(false);
  const detail = PLAN_DETAILS[planName];
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!detail) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
      >
        See full plan details →
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-glow">// Plan details</p>
                <h3 className="mt-1 font-display text-2xl font-bold">{planName}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background hover:bg-surface-elevated"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-3">
                {detail.pillars.map((p) => (
                  <div key={p.tag} className="rounded-lg border border-amber-glow/30 bg-amber-glow/5 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-amber-glow/50 bg-amber-glow/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-glow">
                        {p.tag}
                      </span>
                      <span className="font-display text-sm font-bold">{p.headline}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-vivid-green-glow">
                  What's included
                </h4>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {detail.included.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-vivid-green-glow" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-glow">
                  Limits & quotas
                </h4>
                <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-background/40">
                  {detail.limited.map((l) => (
                    <li key={l.label} className="flex items-start justify-between gap-4 px-3 py-2 text-[13px]">
                      <span className="text-muted-foreground">{l.label}</span>
                      <span className="text-right text-foreground/90">{l.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson-glow">
                  Not in this plan
                </h4>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {detail.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-crimson-glow/80" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-border bg-surface-elevated/40 px-6 py-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-md bg-amber-glow px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 glow-amber"
              >
                Choose {planName}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
