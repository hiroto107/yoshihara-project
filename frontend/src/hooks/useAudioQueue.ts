import { useEffect, useRef, useState } from "react";

interface AudioItem {
  src: string;
  mimeType?: string;
}

export const useAudioQueue = () => {
  const queueRef = useRef<AudioItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      return;
    }

    const current = queueRef.current.shift();
    if (!current) {
      return;
    }

    const audio = new Audio();
    audio.src = current.mimeType
      ? `data:${current.mimeType};base64,${current.src}`
      : current.src;
    audioRef.current = audio;
    setIsPlaying(true);

    const handleEnded = () => {
      setIsPlaying(false);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleEnded);
    };

    const handleError = () => {
      setIsPlaying(false);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleEnded);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("abort", handleEnded);
    audio.play().catch(() => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleEnded);
    };
  }, [isPlaying, revision]);

  const enqueue = (item: AudioItem) => {
    queueRef.current.push(item);
    if (!isPlaying) {
      setRevision((value) => value + 1);
    }
  };

  const reset = () => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  return { enqueue, reset };
};

