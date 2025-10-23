import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { requestConversation } from "./api";
import { ConversationResponse, ConversationTurn, PersonaId } from "./types";
import { useAudioQueue } from "./hooks/useAudioQueue";
import { PERSONA_META } from "./persona";
import "./App.css";

const MAX_TURNS = 20;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(() => resolve(), ms);
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      resolve();
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });

const playAudio = (audio: HTMLAudioElement, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const cleanup = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
    };

    const handleEnded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      resolve();
    };

    const handleAbort = () => {
      cleanup();
      audio.pause();
      resolve();
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    signal.addEventListener("abort", handleAbort, { once: true });

    audio
      .play()
      .catch(() => {
        cleanup();
        resolve();
      });
  });

const buildLogText = (conversation: ConversationResponse | null) => {
  if (!conversation) return "";
  return conversation.turns
    .map(
      (turn, index) =>
        `${index + 1}. ${PERSONA_META[turn.speaker].name}: ${turn.text}`
    )
    .join("\n");
};

function App() {
  const [topic, setTopic] = useState("");
  const [conversation, setConversation] = useState<ConversationResponse | null>(
    null
  );
  const [view, setView] = useState<"prompt" | "conversation">("prompt");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [subtitle, setSubtitle] = useState("お題を入力してください。");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playControllerRef = useRef<AbortController | null>(null);
  const [playbackRevision, setPlaybackRevision] = useState(0);

  const resetPlayback = useCallback(() => {
    playControllerRef.current?.abort();
    playControllerRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setActiveIndex(-1);
  }, []);

  const resetConversation = useCallback(() => {
    resetPlayback();
    setConversation(null);
    setTurns([]);
    setSubtitle("お題を入力してください。");
    setError(null);
  }, [resetPlayback]);

  const handleStart = useCallback(async () => {
    if (isLoading || !topic.trim()) return;

    resetPlayback();
    setIsLoading(true);
    setError(null);
    setSubtitle("会話を生成しています…");
    setConversation(null);
    setTurns([]);
    setLogOpen(false);

    try {
      const result = await requestConversation(topic, MAX_TURNS);
      setConversation(result);
      setTurns(result.turns);
      setView("conversation");
      setPlaybackRevision((revision) => revision + 1);
      if (result.turns.length === 0) {
        setSubtitle(result.summary ?? "会話レスポンスが空でした。");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "会話生成に失敗しました。";
      setError(message);
      setSubtitle("エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, topic, resetPlayback]);

  const handleReset = useCallback(() => {
    resetConversation();
    setTopic("");
    setView("prompt");
    setLogOpen(false);
  }, [resetConversation]);

  const handleReplay = useCallback(() => {
    if (!turns.length) return;
    resetPlayback();
    setPlaybackRevision((revision) => revision + 1);
  }, [resetPlayback, turns.length]);

  useEffect(() => {
    if (!turns.length) {
      return;
    }

    const controller = new AbortController();
    playControllerRef.current?.abort();
    playControllerRef.current = controller;

    const playSequence = async () => {
      const firstTurn = turns[0];
      if (firstTurn) {
        setSubtitle(firstTurn.text);
      }
      for (let index = 0; index < turns.length; index += 1) {
        if (controller.signal.aborted) break;

        const turn = turns[index];
        setActiveIndex(index);
        setSubtitle(turn.text);

        if (turn.audioBase64) {
          const audio = new Audio(
            `data:${turn.mimeType ?? "audio/mpeg"};base64,${turn.audioBase64}`
          );
          audioRef.current = audio;
          await playAudio(audio, controller.signal);
        } else {
          const estimated = Math.min(
            Math.max(turn.text.length * 120, 2200),
            4500
          );
          await wait(estimated, controller.signal);
        }
      }

      if (!controller.signal.aborted) {
        setActiveIndex(-1);
        setSubtitle(
          conversation?.summary ?? "対話が完了しました。"
        );
      }
    };

    playSequence();

    return () => {
      controller.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [turns, conversation?.summary, playbackRevision]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !logOpen &&
        view === "prompt"
      ) {
        if (!isLoading && topic.trim()) {
          event.preventDefault();
          handleStart();
        }
      }

      if (event.key === "Escape" && logOpen) {
        event.preventDefault();
        setLogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleStart, logOpen, isLoading, topic, view]);

  const logText = useMemo(() => buildLogText(conversation), [conversation]);

  const canOpenLog = Boolean(conversation && conversation.turns.length > 0);
  const currentTurnIndex =
    activeIndex >= 0
      ? activeIndex
      : turns.length > 0
        ? turns.length - 1
        : 0;
  const currentTurn = turns[currentTurnIndex];
  const currentSpeakerId = currentTurn?.speaker;
  const totalTurnCount = Math.max(
    conversation?.totalTurns ?? turns.length,
    MAX_TURNS
  );
  const displayedTurnNumber = totalTurnCount
    ? Math.min(currentTurnIndex + 1, totalTurnCount)
    : 0;
  const badgeTopic = conversation?.topic || (topic.trim() ? topic : "（未設定）");

  const canReplay = turns.length > 0;
  const isPromptView = view === "prompt";
  const containerClass = isPromptView
    ? "min-h-screen bg-gradient-to-br from-emerald-100 via-sky-100 to-emerald-50 px-6 pb-16 pt-10 font-sans text-slate-800 md:px-10"
    : "min-h-screen bg-[#04070f] px-6 pb-16 pt-10 font-sans text-slate-100 md:px-10";
  const headerTextClass = isPromptView ? "text-emerald-900" : "text-slate-200";
  const headerSubTextClass = isPromptView ? "text-emerald-700" : "text-slate-400";

  return (
    <div className={containerClass}>

      {view === "prompt" ? (
        <PromptScreen
          topic={topic}
          onTopicChange={(value) => setTopic(value)}
          onStart={handleStart}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <>
          {error && (
            <div className="mx-auto mt-6 w-full max-w-6xl rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <section
            className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/15 bg-[#0b1424] shadow-[0_40px_90px_rgba(3,12,28,0.7)]"
            aria-label="会話シーン"
            style={{
              backgroundImage: "url('/assets/town-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
            <div className="relative flex flex-col gap-6 px-5 pb-8 pt-6 md:gap-8 md:px-10 md:pb-12 md:pt-10">
              <header className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
                <span className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/45 px-5 py-2 font-medium text-slate-100 backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]" />
                  冷泉荘くん × 山王マンションくん — お題: {badgeTopic}
                </span>
                <div className="flex items-center gap-2 text-xs font-medium md:text-sm">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-emerald-200/70 bg-emerald-500/90 px-4 py-2 text-white shadow-md transition hover:bg-emerald-400"
                  >
                    お題を変更
                  </button>
                  <button
                    type="button"
                    onClick={handleReplay}
                    disabled={!canReplay}
                    className={clsx(
                      "rounded-full border border-sky-200/70 px-4 py-2 text-white shadow-md transition",
                      canReplay
                        ? "bg-sky-500/90 hover:bg-sky-400"
                        : "cursor-not-allowed bg-slate-500/50 opacity-60"
                    )}
                  >
                    先頭へ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogOpen(true)}
                    disabled={!canOpenLog}
                    className={clsx(
                      "rounded-full border border-purple-200/70 px-4 py-2 text-white shadow-md transition",
                      canOpenLog
                        ? "bg-purple-500/90 hover:bg-purple-400"
                        : "cursor-not-allowed bg-slate-500/50 opacity-60"
                    )}
                  >
                    Log
                  </button>
                </div>
              </header>

              <div className="grid gap-6 px-2 pb-4 pt-2 md:grid-cols-2 md:gap-8 md:px-4">
                <CharacterColumn
                  personaId="reisen"
                  turns={turns}
                  activeIndex={activeIndex}
                  side="left"
                />
                <CharacterColumn
                  personaId="sanno"
                  turns={turns}
                  activeIndex={activeIndex}
                  side="right"
                />
              </div>

              <DialoguePanel
                subtitle={subtitle}
                speakerId={currentSpeakerId}
                turnNumber={displayedTurnNumber}
                totalTurns={totalTurnCount}
                hasAudio={Boolean(currentTurn?.audioBase64)}
                audioError={currentTurn?.audioError}
              />
            </div>
          </section>

          <LogModal
            open={logOpen}
            onClose={() => setLogOpen(false)}
            logText={logText}
            topic={conversation?.topic ?? topic}
            summary={conversation?.summary}
          />
        </>
      )}
    </div>
  );
}

type CharacterColumnProps = {
  personaId: PersonaId;
  turns: ConversationTurn[];
  activeIndex: number;
  side: "left" | "right";
};

type PromptScreenProps = {
  topic: string;
  onTopicChange: (value: string) => void;
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
};

const PromptScreen = ({
  topic,
  onTopicChange,
  onStart,
  isLoading,
  error,
}: PromptScreenProps) => {
  const disabled = isLoading || topic.trim().length === 0;

  return (
    <section className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full max-w-3xl rounded-[32px] border border-emerald-200/60 bg-white/90 px-6 py-8 shadow-[0_36px_80px_rgba(15,118,110,0.25)] backdrop-blur md:px-10 md:py-12">
        <header className="space-y-3 text-emerald-900">
          <h2 className="text-2xl font-semibold md:text-3xl">お題を設定</h2>
          <p className="text-sm leading-relaxed text-emerald-700 md:text-base">
            テーマや課題、議題などを入力すると、冷泉荘くんと山王マンションくんが
            最大20ターンまで交互に会話して合意形成を目指します。
          </p>
        </header>
        <label
          className="mt-6 flex flex-col gap-3 text-sm font-medium text-emerald-900 md:mt-8 md:text-base"
          htmlFor="topic-input"
        >
          <span>お題</span>
          <textarea
            id="topic-input"
            value={topic}
            placeholder="例: 福岡で冷泉荘と山王マンションが共同で開催するイベント案を考えて"
            onChange={(event) => onTopicChange(event.target.value)}
            disabled={isLoading}
            rows={6}
            className="w-full rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-base text-emerald-900 shadow-inner focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <p className="mt-3 text-xs text-emerald-700 md:text-sm">
          Enter キーで開始できます（Shift+Enter で改行）。
        </p>
        {error && (
          <p className="mt-4 rounded-xl border border-red-300/40 bg-red-100 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
            onClick={onStart}
            disabled={disabled}
          >
            {isLoading ? "会話を準備中…" : "会話を開始"}
          </button>
        </div>
      </div>
    </section>
  );
};

const CharacterColumn = ({ personaId, turns, activeIndex, side }: CharacterColumnProps) => {
  const persona = PERSONA_META[personaId];
  const personaTurns = turns.filter((turn) => turn.speaker === personaId);
  const latestTurn = personaTurns[personaTurns.length - 1];
  const isActive = activeIndex !== -1 && turns[activeIndex]?.speaker === personaId;
  const hasAudio = Boolean(latestTurn?.audioBase64);
  const audioError = latestTurn?.audioError;

  return (
    <section
      className={clsx(
        "flex w-full justify-center md:justify-start",
        side === "right" && "md:justify-end"
      )}
      aria-label={`${persona.name} の発話情報`}
    >
      <div
        className={clsx(
          "relative flex w-full max-w-xs flex-col items-center rounded-[32px] border border-white/20 bg-white/5 px-6 pb-10 pt-16 text-center shadow-[0_28px_60px_rgba(5,12,28,0.55)] backdrop-blur-xl transition md:max-w-sm",
          isActive && "border-sky-200/70 shadow-[0_34px_68px_rgba(56,189,248,0.35)]",
          side === "right" && "md:text-right"
        )}
      >
        <div
          className={clsx(
            "absolute top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-1 font-medium text-slate-100 backdrop-blur",
            side === "left" ? "left-6" : "right-6"
          )}
        >
          <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          <span>{persona.name}</span>
        </div>
        <img
          src={persona.image}
          alt={`${persona.name}のイラスト`}
          className="w-[220px] drop-shadow-[0_26px_38px_rgba(5,12,28,0.55)] md:w-[280px]"
        />
      </div>
    </section>
  );
};

type DialoguePanelProps = {
  subtitle: string;
  speakerId?: PersonaId;
  turnNumber: number;
  totalTurns: number;
  hasAudio: boolean;
  audioError?: string;
};

const DialoguePanel = ({ subtitle, speakerId, turnNumber, totalTurns, hasAudio, audioError }: DialoguePanelProps) => {
  const persona = speakerId ? PERSONA_META[speakerId] : undefined;
  const turnDisplay = totalTurns ? Math.max(turnNumber, 1) : 0;

  return (
    <section
      className="rounded-[32px] border border-white/20 bg-[rgba(5,9,18,0.85)] px-6 py-6 text-left shadow-[0_32px_60px_rgba(0,0,0,0.55)] backdrop-blur-md md:px-10 md:py-8"
      aria-live="polite"
    >
      <div
        className={clsx(
          "mb-4 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/5 px-4 py-1 text-sm font-semibold text-white/90",
          !persona && "opacity-70"
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.75)]" />
        <span>{persona ? persona.name : "冷泉荘くん"}</span>
      </div>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100 md:text-lg">
        {subtitle || "..."}
      </p>
      <footer className="mt-6 flex items-center justify-between text-xs text-slate-300 md:text-sm">
        <span className="inline-flex items-center gap-2">
          {hasAudio ? (
            <>
              <span className="text-emerald-300">🔊</span> 再生中
            </>
          ) : audioError ? (
            <>
              <span className="text-amber-300">🔇</span> {audioError}
            </>
          ) : (
            <>
              <span className="text-amber-300">🔇</span> 音声は生成されませんでした
            </>
          )}
        </span>
        <span>{totalTurns ? `${turnDisplay} / ${totalTurns}` : "-"}</span>
      </footer>
    </section>
  );
};

type LogModalProps = {
  open: boolean;
  onClose: () => void;
  logText: string;
  topic: string;
  summary?: string;
};

const LogModal = ({ open, onClose, logText, topic, summary }: LogModalProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!open) {
      setCopyState("idle");
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      setCopyState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl rounded-[28px] border border-white/15 bg-[#0f1729]/95 px-6 py-6 shadow-2xl backdrop-blur-md md:px-8 md:py-8">
        <header className="mb-4 flex items-center justify-between gap-3 text-slate-100">
          <div>
            <h2 className="text-xl font-semibold">会話ログ</h2>
            <p className="mt-1 text-sm text-slate-300">お題: {topic || "(未入力)"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-lg leading-none text-white transition hover:border-white/40 hover:bg-white/20"
          >
            ×
          </button>
        </header>
        {summary && (
          <p className="mb-4 rounded-xl border border-sky-300/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            総括: {summary}
          </p>
        )}
        <pre
          className="h-64 w-full resize-none overflow-y-auto rounded-2xl border border-white/15 bg-white/5 px-4 py-4 font-mono text-xs text-slate-200 shadow-inner"
          tabIndex={0}
        >
          {logText || "まだ会話ログはありません。"}
        </pre>
        <footer className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!logText}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copyState === "copied"
              ? "コピー済み"
              : copyState === "error"
              ? "コピー失敗"
              : "全文コピー"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;
