import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Brain,
  Flame,
  Hourglass,
  Layers3,
  LoaderCircle,
  MessageSquareQuote,
  Mountain,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

const introText = `I am Goz. Most people try to 'think' their way into confidence, but real self-belief is built on Evidence. I am here to help you look into a 'Mirror' to find the patterns you usually miss.

By identifying these hidden patterns, we stop the mental drain and start logging 'wins' that your brain can actually trust. Here are the five pathways we can use to build your Self-Trust Ledger today:

A) The Life Audit (Clear the Fog): We feel anxious when we have 'leaks' in our life that we aren't naming. We will rate your life areas to find the one specific spot where your energy is draining, so you can stop feeling 'generally' overwhelmed.

B) The Hidden Payoff (Break the Cycle): You aren't 'lazy.' You have a 'Safety System' that sabotages you to protect you from judgment. We will find the secret 'benefit' your brain gets from staying small, so you can move past it without shame.

C) The Neural Simulator (Pre-Game Reps): Anxiety comes from the unknown. We will roleplay your most feared conversations. By getting 'reps' in now, your nervous system stays calm when the real moment happens.

D) The Trigger Tracer (Kill the Spiral): When we overreact, it's usually an 'old script' playing out. We will trace your current frustration to its source to prove it doesn't belong in your present.

E) The Personal Code (Build your OS): You have already succeeded in the past, but you likely haven't 'coded' why. We will extract the principles from your previous wins to create a manual for your future self.

Which pathway should we open?`;

const closeText =
  'Now, give me one Micro-Action for the next 10 minutes. It must be so small you cannot fail. We are logging this as a win in your Self-Trust Ledger.';

const modes = [
  {
    id: 'A',
    title: 'The Life Audit',
    subtitle: "Use this when you feel overwhelmed but can't tell what's draining you.",
    accent: 'from-sky-400/30 via-cyan-300/10 to-transparent',
    icon: Layers3,
  },
  {
    id: 'B',
    title: 'The Hidden Payoff',
    subtitle: "Use this when you keep avoiding something and don't understand why.",
    accent: 'from-blue-400/30 via-indigo-300/10 to-transparent',
    icon: Flame,
  },
  {
    id: 'C',
    title: 'The Neural Simulator',
    subtitle: "Use this when you're nervous about a conversation or situation coming up.",
    accent: 'from-cyan-400/30 via-sky-300/10 to-transparent',
    icon: MessageSquareQuote,
  },
  {
    id: 'D',
    title: 'The Trigger Tracer',
    subtitle: 'Use this when something upset you more than expected and you want to understand it.',
    accent: 'from-sky-300/30 via-blue-200/10 to-transparent',
    icon: Brain,
  },
  {
    id: 'E',
    title: 'The Personal Code',
    subtitle: 'Use this when you want to learn from past wins and build better habits.',
    accent: 'from-teal-300/30 via-cyan-200/10 to-transparent',
    icon: Mountain,
  },
];

const tourStorageKey = 'goz-guided-tour-complete';

const tourSteps = [
  {
    id: 'hero',
    title: 'What this is',
    description: 'A guided chat to help you get clear and take one small next step.',
    target: 'hero',
    cta: 'Next',
  },
  {
    id: 'cards',
    title: 'Choose one exercise',
    description: 'Pick the card that feels closest to what you are dealing with right now.',
    target: 'cards',
    cta: 'Continue',
    waitForModeSelection: true,
  },
  {
    id: 'composer',
    title: 'Reply here',
    description: 'Answer in your own words. Goz will guide you from there.',
    target: 'composer',
    cta: 'Next',
  },
  {
    id: 'back',
    title: 'Switch anytime',
    description: 'Use this to go back and try a different exercise.',
    target: 'back',
    cta: 'Finish',
  },
];

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
  };
}

function formatMessageContent(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1');
}

async function requestAiReply(messages, selection) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, selection }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Failed to get response from Groq.');
  }

  const payload = await response.json();
  return payload.message;
}

export default function App() {
  const [activeMode, setActiveMode] = useState(null);
  const [messages, setMessages] = useState([createMessage('assistant', introText)]);
  const [input, setInput] = useState('');
  const [ledger, setLedger] = useState({ evidence: 0, patterns: 0 });
  const [showWinModal, setShowWinModal] = useState(false);
  const [microWin, setMicroWin] = useState('');
  const [winLogged, setWinLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [patternLoggedThisSession, setPatternLoggedThisSession] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourRect, setTourRect] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const chatRef = useRef(null);
  const historyNavigationRef = useRef(false);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showWinModal, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasCompletedTour = window.localStorage.getItem(tourStorageKey) === 'true';
    if (!hasCompletedTour) {
      setShowTour(true);
    }
  }, []);

  const activeConfig = useMemo(
    () => modes.find((mode) => mode.id === activeMode) || null,
    [activeMode],
  );

  const currentTourStep = showTour ? tourSteps[tourStepIndex] : null;

  function resetDashboardView() {
    setActiveMode(null);
    setError('');
    setShowWinModal(false);
    setIsLoading(false);
    setMessages([createMessage('assistant', introText)]);
  }

  function closeMode(options = {}) {
    const { useBrowserBack = false } = options;

    if (typeof window !== 'undefined' && useBrowserBack && window.history.state?.screen === 'mode') {
      historyNavigationRef.current = true;
      window.history.back();
      return;
    }

    resetDashboardView();
  }

  useEffect(() => {
    if (!showTour || !currentTourStep || typeof window === 'undefined') {
      setTourRect(null);
      return;
    }

    const updateTourRect = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const target = document.querySelector(`[data-tour="${currentTourStep.target}"]`);
      if (!target) {
        setTourRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTourRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const timer = window.setTimeout(updateTourRect, 80);
    updateTourRect();
    window.addEventListener('resize', updateTourRect);
    window.addEventListener('scroll', updateTourRect, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateTourRect);
      window.removeEventListener('scroll', updateTourRect, true);
    };
  }, [showTour, currentTourStep, activeMode, messages.length]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.history.state) {
      window.history.replaceState({ screen: 'dashboard' }, '');
    }

    const handlePopState = async (event) => {
      const state = event.state;

      if (!state || state.screen === 'dashboard') {
        resetDashboardView();
        historyNavigationRef.current = false;
        return;
      }

      if (state.screen === 'mode') {
        const nextMode = modes.find((mode) => mode.id === state.modeId);
        if (!nextMode) {
          resetDashboardView();
          historyNavigationRef.current = false;
          return;
        }

        setShowTour(false);
        await beginMode(nextMode, { pushHistory: false });
        historyNavigationRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function finishTour() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(tourStorageKey, 'true');
    }
    setShowTour(false);
    setTourStepIndex(0);
  }

  async function handleTourNext() {
    const step = tourSteps[tourStepIndex];

    if (step?.waitForModeSelection && !activeMode) {
      return;
    }

    if (tourStepIndex >= tourSteps.length - 1) {
      finishTour();
      return;
    }

    setTourStepIndex((current) => current + 1);
  }

  async function pushConversation(nextMessages, options = {}) {
    setIsLoading(true);
    setError('');

    try {
      const aiText = await requestAiReply(
        nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        options.selection,
      );

      const assistantMessage = createMessage('assistant', aiText);
      setMessages((current) => [...current, assistantMessage]);

      if (!patternLoggedThisSession && aiText.includes(closeText)) {
        setLedger((current) => ({
          ...current,
          patterns: current.patterns + 1,
        }));
        setPatternLoggedThisSession(true);
      }

      if (aiText.includes(closeText) && !options.skipModal) {
        setShowWinModal(true);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function beginMode(mode, options = {}) {
    const { pushHistory = true } = options;

    if (typeof window !== 'undefined' && pushHistory && !historyNavigationRef.current) {
      window.history.pushState({ screen: 'mode', modeId: mode.id }, '');
    }

    setActiveMode(mode.id);
    setWinLogged(false);
    setShowWinModal(false);
    setPatternLoggedThisSession(false);
    setError('');

    if (showTour && currentTourStep?.waitForModeSelection) {
      setTourStepIndex((current) => Math.min(current + 1, tourSteps.length - 1));
    }

    const nextMessages = [];
    setMessages(nextMessages);
    await pushConversation(nextMessages, {
      selection: {
        id: mode.id,
        title: mode.title,
      },
    });
  }

  async function handleSend(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !activeMode || isLoading) {
      return;
    }

    const userMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    await pushConversation(nextMessages);
  }

  function logMicroWin(event) {
    event.preventDefault();
    if (!microWin.trim()) {
      return;
    }

    setLedger((current) => ({
      ...current,
      evidence: current.evidence + 1,
    }));
    setMessages((current) => [
      ...current,
      createMessage('user', `Micro-Action: ${microWin.trim()}`),
      createMessage('assistant', 'Win Logged. That counts as evidence, not intention.'),
    ]);
    setShowWinModal(false);
    setMicroWin('');
    setWinLogged(true);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-radial text-white">
      <div className="grid-glow pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div data-tour="hero" className="relative">
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-sky-200/70">Goz / Self-Trust Ledger</p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Build Your Evidence
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Track your actions. Log your wins. Build self-trust through real evidence.
            </p>
          </div>
          <div className="panel flex min-w-[280px] items-center gap-5 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/60">Small Wins Logged</p>
              <p className="mt-1 text-3xl font-bold text-white">{ledger.evidence}</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/60">Insights Found</p>
              <p className="mt-1 text-3xl font-bold text-white">{ledger.patterns}</p>
            </div>
          </div>
        </header>

        {!activeMode ? (
          <main className="space-y-6">
            <section data-tour="cards" className="relative">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Choose one</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Start with the card that feels most like your situation right now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTourStepIndex(0);
                    setShowTour(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-100 transition hover:border-sky-300/40 hover:bg-sky-400/15"
                >
                  <Sparkles className="h-4 w-4" />
                  Guided tour
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {modes.map((mode, index) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => beginMode(mode)}
                      className="panel group relative overflow-hidden p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 hover:shadow-glow animate-rise"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${mode.accent} opacity-80`} />
                      <div className="relative flex h-full flex-col">
                        <div className="mb-10 flex items-start justify-between">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.3em] text-sky-100/80">
                            {mode.id}
                          </span>
                          <Icon className="h-5 w-5 text-sky-200 transition group-hover:scale-110 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">{mode.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{mode.subtitle}</p>
                        <div className="mt-auto pt-8 text-sm text-sky-100/80">
                          Start this exercise <ArrowRight className="ml-2 inline h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>
        ) : (
          <main className="grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => closeMode({ useBrowserBack: true })}
                data-tour="back"
                className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-sky-100/80 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to dashboard
              </button>

              <div className="panel flex flex-col gap-5 p-5">
                <div className="rounded-3xl border border-sky-300/15 bg-sky-400/5 p-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Current Exercise</p>
                  <h2 className="mt-3 text-2xl font-bold">{activeConfig?.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Goz guides this conversation and helps you end with one small next step.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">How Progress Works</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p className="flex items-center gap-3">
                      <BadgeCheck className="h-4 w-4 text-sky-300" />
                      Each small action you log counts as a real win.
                    </p>
                    <p className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-sky-300" />
                      Each conversation helps you uncover patterns and name what is really going on.
                    </p>
                    <p className="flex items-center gap-3">
                      <Hourglass className="h-4 w-4 text-sky-300" />
                      You always finish with one practical next step, not a vague intention.
                    </p>
                  </div>
                </div>
              </div>

            </aside>

            <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Self-Trust Ledger</p>
                {winLogged ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-100 animate-pulseRing">
                    <BadgeCheck className="h-4 w-4" />
                    Win Logged
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}
              </div>

              <div ref={chatRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-3xl rounded-3xl border px-4 py-3 ${
                      message.role === 'assistant'
                        ? 'border-sky-300/10 bg-sky-400/5'
                        : 'ml-auto border-white/10 bg-white/[0.05]'
                    }`}
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.32em] text-sky-200/60">
                      {message.role === 'assistant' ? 'Goz' : 'You'}
                    </p>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-100">
                      {formatMessageContent(message.content)}
                    </p>
                  </div>
                ))}

                {isLoading ? (
                  <div className="max-w-3xl rounded-3xl border border-sky-300/10 bg-sky-400/5 px-4 py-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.32em] text-sky-200/60">Goz</p>
                    <p className="flex items-center gap-3 text-sm text-slate-200">
                      <LoaderCircle className="h-4 w-4 animate-spin text-sky-300" />
                      Thinking with Goz...
                    </p>
                  </div>
                ) : null}
              </div>

              <form onSubmit={handleSend} data-tour="composer" className="border-t border-white/10 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={3}
                    placeholder="Write your honest answer here."
                    disabled={isLoading}
                    className="min-h-[88px] flex-1 rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-3xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-sky-400/50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </section>
          </main>
        )}
      </div>

      {showWinModal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#02050b]/80 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Log your 10-minute win</p>
            <h3 className="mt-3 text-2xl font-bold">Turn insight into proof.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Enter one micro-action so small you cannot fail. This gets counted in your ledger.
            </p>
            <form onSubmit={logMicroWin} className="mt-5 space-y-4">
              <input
                value={microWin}
                onChange={(event) => setMicroWin(event.target.value)}
                placeholder="Send the email draft. Walk for 10 minutes. Write 3 bullets."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:shadow-glow"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Log Win
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showTour && currentTourStep ? (
        <div className="pointer-events-none fixed inset-0 z-30 bg-[#02050b]/72">
          {tourRect ? (
            <div
              className="pointer-events-none absolute rounded-[2rem] border border-sky-300/60 shadow-[0_0_0_9999px_rgba(2,5,11,0.72)] transition-all duration-200"
              style={{
                top: Math.max(tourRect.top - 8, 8),
                left: Math.max(tourRect.left - 8, 8),
                width: Math.max(tourRect.width + 16, 120),
                height: Math.max(tourRect.height + 16, 56),
              }}
            />
          ) : null}
          <div
            className="pointer-events-auto absolute max-w-xs rounded-3xl border border-sky-300/20 bg-slate-950/95 p-5 shadow-2xl shadow-sky-950/40"
            style={{
              top: tourRect
                ? Math.min(tourRect.top + tourRect.height + 18, Math.max(viewport.height - 220, 16))
                : 24,
              left: tourRect
                ? Math.min(Math.max(tourRect.left, 16), Math.max(viewport.width - 340, 16))
                : 16,
            }}
          >
            <div
              className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-sky-300/20 bg-slate-950/95"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Guided tour</p>
                <h3 className="mt-2 text-xl font-bold text-white">{currentTourStep.title}</h3>
              </div>
              <button
                type="button"
                onClick={finishTour}
                className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-300 transition hover:text-white"
                aria-label="Close guided tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{currentTourStep.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/60">
                {tourStepIndex + 1} / {tourSteps.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={finishTour}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                >
                  Skip
                </button>
                {currentTourStep.waitForModeSelection && !activeMode ? (
                  <div className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950">
                    Click any card to continue
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTourNext}
                    className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    {currentTourStep.cta}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
