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
  Target,
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
    subtitle: "Find the leak so vague stress turns into a solvable problem.",
    accent: 'from-sky-400/30 via-cyan-300/10 to-transparent',
    icon: Layers3,
  },
  {
    id: 'B',
    title: 'The Hidden Payoff',
    subtitle: 'Find the safety system that keeps sabotage alive.',
    accent: 'from-blue-400/30 via-indigo-300/10 to-transparent',
    icon: Flame,
  },
  {
    id: 'C',
    title: 'The Neural Simulator',
    subtitle: 'Practice the feared talk before the pressure hits.',
    accent: 'from-cyan-400/30 via-sky-300/10 to-transparent',
    icon: MessageSquareQuote,
  },
  {
    id: 'D',
    title: 'The Trigger Tracer',
    subtitle: "Trace the old script behind today's reaction.",
    accent: 'from-sky-300/30 via-blue-200/10 to-transparent',
    icon: Brain,
  },
  {
    id: 'E',
    title: 'The Personal Code',
    subtitle: 'Extract the rules your past wins and regrets taught you.',
    accent: 'from-teal-300/30 via-cyan-200/10 to-transparent',
    icon: Mountain,
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
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showWinModal, isLoading]);

  const activeConfig = useMemo(
    () => modes.find((mode) => mode.id === activeMode) || null,
    [activeMode],
  );

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

  async function beginMode(mode) {
    setActiveMode(mode.id);
    setWinLogged(false);
    setShowWinModal(false);
    setPatternLoggedThisSession(false);
    setError('');

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
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-sky-200/70">Goz / Self-Trust Ledger</p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Confidence, turned into evidence.
            </h1>
          </div>
          <div className="panel flex min-w-[280px] items-center gap-5 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/60">Evidence Points</p>
              <p className="mt-1 text-3xl font-bold text-white">{ledger.evidence}</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200/60">Patterns Identified</p>
              <p className="mt-1 text-3xl font-bold text-white">{ledger.patterns}</p>
            </div>
          </div>
        </header>

        {!activeMode ? (
          <main className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                      Enter session <ArrowRight className="ml-2 inline h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </main>
        ) : (
          <main className="grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="panel flex flex-col gap-5 p-5">
              <button
                type="button"
                onClick={() => {
                  setActiveMode(null);
                  setError('');
                  setShowWinModal(false);
                  setIsLoading(false);
                  setMessages([createMessage('assistant', introText)]);
                }}
                className="inline-flex items-center gap-2 text-sm text-sky-100/80 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to dashboard
              </button>

              <div className="rounded-3xl border border-sky-300/15 bg-sky-400/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Active Flow</p>
                <h2 className="mt-3 text-2xl font-bold">{activeConfig?.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Live responses follow the guided onboarding and playbook logic in your system prompt.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Ledger Mechanics</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p className="flex items-center gap-3">
                    <BadgeCheck className="h-4 w-4 text-sky-300" />
                    Evidence points rise when a 10-minute win is logged.
                  </p>
                  <p className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-sky-300" />
                    Patterns rise when Goz identifies the underlying pattern and reaches the required close.
                  </p>
                  <p className="flex items-center gap-3">
                    <Hourglass className="h-4 w-4 text-sky-300" />
                    The close is always a micro-action, never vague intention.
                  </p>
                </div>
              </div>

            </aside>

            <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Self-Trust Ledger</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-slate-300">Evidence Points</p>
                    <p className="mt-1 text-3xl font-bold">{ledger.evidence}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-slate-300">Patterns Identified</p>
                    <p className="mt-1 text-3xl font-bold">{ledger.patterns}</p>
                  </div>
                </div>
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
                      Thinking with Groq...
                    </p>
                  </div>
                ) : null}
              </div>

              <form onSubmit={handleSend} className="border-t border-white/10 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={3}
                    placeholder="Write the next honest answer."
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
    </div>
  );
}
