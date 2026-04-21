'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LucideUpload, LucideFileVideo, LucideX, LucideCheck } from 'lucide-react';

interface VideoUploadPanelProps {
  onVideoUploaded: (filename: string, videoPath: string, metadata: VideoMetadata, file?: File) => void;
  uploading?: boolean;
}

interface VideoMetadata {
  duration: number;
  fps: number;
  totalFrames: number;
  resolution: { width: number; height: number };
}

export default function VideoUploadPanel({ onVideoUploaded, uploading = false }: VideoUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Invalid file type. Please upload MP4, AVI, MOV, MKV, or WebM.');
      return;
    }

    setFile(selectedFile);

    // Upload file
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8001/api/v1/video-test/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadSuccess(true);

      onVideoUploaded(
        result.filename,
        result.video_path,
        {
          duration: result.duration,
          fps: result.fps,
          totalFrames: result.total_frames,
          resolution: result.resolution,
        },
        selectedFile
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setFile(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card surface-3d p-6"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <LucideFileVideo size={18} className="text-indigo-400" />
        Upload Video
      </h3>

      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-zinc-700 hover:border-zinc-600'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <LucideUpload size={48} className="mx-auto mb-4 text-zinc-500" />
          <p className="text-sm text-zinc-400 mb-2">
            Drag and drop video file here, or click to browse
          </p>
          <p className="text-xs text-zinc-500">
            Supported formats: MP4, AVI, MOV, MKV, WebM
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <LucideFileVideo size={20} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-zinc-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {uploadSuccess ? (
              <LucideCheck size={20} className="text-emerald-500" />
            ) : (
              <button
                onClick={clearFile}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <LucideX size={20} className="text-zinc-500" />
              </button>
            )}
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <p className="text-xs text-rose-400">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-400">Video uploaded successfully</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
