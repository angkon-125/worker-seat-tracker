'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LucideVideo, 
  LucidePlay, 
  LucideRefreshCw
} from 'lucide-react';
import VideoUploadPanel from '@/components/video-test/VideoUploadPanel';
import AnalysisControls from '@/components/video-test/AnalysisControls';
import ZoneEditorPanel from '@/components/video-test/ZoneEditorPanel';
import PersonTrackingPanel from '@/components/video-test/PersonTrackingPanel';
import VideoPlayerWithOverlay from '@/components/video-test/VideoPlayerWithOverlay';
import ResultStats from '@/components/video-test/ResultStats';
import SeatSummaryCard from '@/components/video-test/SeatSummaryCard';
import SeatTimeline from '@/components/video-test/SeatTimeline';
import ExplanationBox from '@/components/video-test/ExplanationBox';
import { 
  AnalysisMode, 
  FrontendSeatZone,
  VideoAnalysisRequest,
  VideoAnalysisResult,
  AnalysisJobStatus,
  VideoMetadata 
} from '@/lib/video-test/types';

export default function VideoTestPage() {
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [videoFilename, setVideoFilename] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [zones, setZones] = useState<FrontendSeatZone[]>([
    { seatId: 'A', x1: 0.3, y1: 0.2, x2: 0.7, y2: 0.8 },
  ]);
  
  // Analysis configuration
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.SEAT_OCCUPANCY_ONLY);
  const [frameSkip, setFrameSkip] = useState(6);
  const [occupancyThreshold, setOccupancyThreshold] = useState(0.4);
  const [enablePersonTracking, setEnablePersonTracking] = useState(false);
  const [saveAnnotatedVideo, setSaveAnnotatedVideo] = useState(true);
  
  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<AnalysisJobStatus | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  
  // Person tracking selection
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  // Cleanup blob URL on unmount or when video changes
  useEffect(() => {
    return () => {
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8001/api/v1/video-test/status/${jobId}`);
        if (response.ok) {
          const status: AnalysisJobStatus = await response.json();
          setJobStatus(status);
          
          if (status.status === 'completed' && status.result) {
            setResult(status.result);
            setAnalyzing(false);
          } else if (status.status === 'failed') {
            setAnalyzing(false);
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  const handleVideoUploaded = (filename: string, _videoPath: string, metadata: VideoMetadata, file?: File) => {
    setVideoFilename(filename);
    setVideoMetadata(metadata);
    if (file) {
      setVideoFile(file);
      setVideoBlobUrl(URL.createObjectURL(file));
    }
    setResult(null);
    setJobStatus(null);
    setJobId(null);
    setSelectedSeatId(null);
    setCurrentVideoTime(0);
    setSeekToTime(null);
  };

  const handleStartAnalysis = async () => {
    if (!videoFilename) {
      alert('Please upload a video first');
      return;
    }

    if (zones.length === 0) {
      alert('Please add at least one seat zone');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setJobStatus(null);

    const request: VideoAnalysisRequest = {
      video_filename: videoFilename,
      seat_zones: zones.map(z => ({
        seat_id: z.seatId,
        x1: z.x1,
        y1: z.y1,
        x2: z.x2,
        y2: z.y2,
        label: z.label,
      })),
      config: {
        mode,
        frame_skip: frameSkip,
        frame_width: 640,
        frame_height: 360,
        use_motion_gating: true,
        occupancy_threshold: occupancyThreshold,
        confirmation_frames: 2,
        exit_delay_seconds: 5.0,
        enable_person_tracking: enablePersonTracking,
        save_annotated_video: saveAnnotatedVideo,
      },
    };

    try {
      const response = await fetch('http://localhost:8001/api/v1/video-test/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed to start');
      }

      const status: AnalysisJobStatus = await response.json();
      setJobId(status.job_id);
      setJobStatus(status);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(error instanceof Error ? error.message : 'Analysis failed');
      setAnalyzing(false);
    }
  };

  const handleDownloadAnnotated = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`http://localhost:8001/api/v1/video-test/download/${jobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotated_${jobId}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download annotated video');
    }
  };

  const handleReset = () => {
    if (videoBlobUrl) {
      URL.revokeObjectURL(videoBlobUrl);
    }
    setVideoFilename(null);
    setVideoMetadata(null);
    setVideoFile(null);
    setVideoBlobUrl(null);
    setResult(null);
    setJobStatus(null);
    setJobId(null);
    setAnalyzing(false);
    setSelectedPerson(null);
    setSelectedSeatId(null);
    setCurrentVideoTime(0);
    setSeekToTime(null);
  };

  const handleSeek = (time: number) => {
    setSeekToTime(time);
    setCurrentVideoTime(time);
  };

  return (
    <div className="flex flex-col gap-6 h-screen p-6 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="surface-3d p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-2xl">
              <LucideVideo className="text-indigo-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-outfit font-bold">Video Test & Tracking</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Test occupancy tracking on uploaded videos
              </p>
            </div>
          </div>

          {result && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              <LucideRefreshCw size={16} />
              New Analysis
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      {!result ? (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto pr-2">
            <VideoUploadPanel
              onVideoUploaded={handleVideoUploaded}
              uploading={analyzing}
            />

            {videoMetadata && (
              <>
                <ZoneEditorPanel zones={zones} onZonesChange={setZones} />
                <AnalysisControls
                  mode={mode}
                  onModeChange={setMode}
                  frameSkip={frameSkip}
                  onFrameSkipChange={setFrameSkip}
                  occupancyThreshold={occupancyThreshold}
                  onOccupancyThresholdChange={setOccupancyThreshold}
                  enablePersonTracking={enablePersonTracking}
                  onPersonTrackingChange={setEnablePersonTracking}
                  saveAnnotatedVideo={saveAnnotatedVideo}
                  onAnnotatedVideoChange={setSaveAnnotatedVideo}
                />

                {/* Start Analysis Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleStartAnalysis}
                  disabled={analyzing}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <LucideRefreshCw size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <LucidePlay size={20} />
                      Start Analysis
                    </>
                  )}
                </motion.button>

                {/* Progress */}
                {jobStatus && (
                  <div className="glass-card surface-3d p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">{jobStatus.message}</span>
                      <span className="text-sm font-medium">{jobStatus.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobStatus.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Video Preview */}
          {videoMetadata && videoBlobUrl && (
            <div className="w-1/2 flex flex-col min-h-0">
              <VideoPlayerWithOverlay
                videoUrl={videoBlobUrl}
                zones={zones}
                seats={[]}
                currentTime={currentVideoTime}
                onTimeChange={setCurrentVideoTime}
                selectedSeatId={selectedSeatId}
                onSelectSeat={setSelectedSeatId}
                seekToTime={seekToTime}
              />
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 min-h-[380px]">
            <VideoPlayerWithOverlay
              videoUrl={videoBlobUrl || ''}
              zones={zones}
              seats={result.seat_summaries}
              currentTime={currentVideoTime}
              onTimeChange={setCurrentVideoTime}
              selectedSeatId={selectedSeatId}
              onSelectSeat={setSelectedSeatId}
              seekToTime={seekToTime}
            />
            <div className="flex flex-col gap-4">
              <ResultStats seats={result.seat_summaries} />
              {result.annotated_video_path && (
                <button
                  onClick={handleDownloadAnnotated}
                  className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors text-sm"
                >
                  Download Annotated Video
                </button>
              )}
              <ExplanationBox />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.seat_summaries.map((seat) => (
              <SeatSummaryCard
                key={seat.seat_id}
                seat={seat}
                videoDuration={result.video_summary.duration_seconds}
                currentTime={currentVideoTime}
                selected={selectedSeatId === seat.seat_id}
                onSelect={setSelectedSeatId}
                onSeek={handleSeek}
              />
            ))}
          </div>

          <SeatTimeline
            seats={result.seat_summaries}
            videoDuration={result.video_summary.duration_seconds}
            currentTime={currentVideoTime}
            selectedSeatId={selectedSeatId}
            onSelectSeat={setSelectedSeatId}
            onSeek={handleSeek}
          />

          <PersonTrackingPanel
            personTracking={result.person_tracking}
            selectedPerson={selectedPerson}
            onSelectPerson={setSelectedPerson}
          />
        </div>
      )}
    </div>
  );
}
