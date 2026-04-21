'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucidePlay, LucidePause, LucideMaximize2 } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl: string;
  annotatedVideoUrl?: string | null;
}

export default function VideoPreview({ videoUrl, annotatedVideoUrl }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoError(false);
    }
  };

  const handleError = () => {
    setVideoError(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentUrl = showAnnotated && annotatedVideoUrl ? annotatedVideoUrl : videoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card surface-3d p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Video Preview</h3>
        {annotatedVideoUrl && (
          <button
            onClick={() => setShowAnnotated(!showAnnotated)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showAnnotated
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {showAnnotated ? 'Annotated' : 'Original'}
          </button>
        )}
      </div>

      <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden aspect-video flex-1">
        {!currentUrl ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <p className="text-sm">No video loaded</p>
          </div>
        ) : videoError ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <p className="text-sm">Failed to load video</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={currentUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {currentUrl && !videoError && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-3"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {isPlaying ? <LucidePause size={20} /> : <LucidePlay size={20} />}
              </button>

              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <LucideMaximize2 size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
