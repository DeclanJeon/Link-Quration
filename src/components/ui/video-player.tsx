// src/components/ui/video-player.tsx
"use client"

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, 
  SkipForward, Settings, Subtitles 
} from "lucide-react";
import { TimelineSegment } from '@/types/media-analysis';

interface VideoPlayerProps {
  url: string;
  timeline?: TimelineSegment[];
  onTimeUpdate?: (currentTime: number) => void;
  onSegmentChange?: (segmentIndex: number) => void;
}

export const VideoPlayer = ({ 
  url, 
  timeline = [], 
  onTimeUpdate, 
  onSegmentChange 
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<number | null>(null);

  // 현재 세그먼트 감지
  useEffect(() => {
    if (timeline.length > 0) {
      const segment = timeline.findIndex(
        seg => currentTime >= seg.startTime.seconds && currentTime < seg.endTime.seconds
      );
      
      if (segment !== -1 && segment !== currentSegment) {
        setCurrentSegment(segment);
        onSegmentChange?.(segment);
      }
    }
  }, [currentTime, timeline, currentSegment, onSegmentChange]);

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
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToSegment = (segmentIndex: number) => {
    const segment = timeline[segmentIndex];
    if (segment && videoRef.current) {
      videoRef.current.currentTime = segment.startTime.seconds;
      setCurrentTime(segment.startTime.seconds);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {/* 비디오 */}
      <div className="relative">
        <video
          ref={videoRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          className="w-full aspect-video"
        />
        
        {/* 현재 세그먼트 오버레이 */}
        {currentSegment !== null && timeline[currentSegment] && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-black/70 text-white">
              {timeline[currentSegment].title}
            </Badge>
          </div>
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="p-4 bg-gray-900 text-white">
        {/* 진행률 바 */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek([Math.max(0, currentTime - 10)])}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek([Math.min(duration, currentTime + 10)])}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                  }
                }}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={(value) => {
                  const vol = value[0];
                  setVolume(vol);
                  if (videoRef.current) {
                    videoRef.current.volume = vol;
                  }
                }}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Subtitles className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 타임라인 세그먼트 */}
      {timeline.length > 0 && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="text-sm text-gray-300 mb-2">타임라인</div>
          <div className="flex gap-2 overflow-x-auto">
            {timeline.map((segment, index) => (
              <Button
                key={segment.id}
                variant={currentSegment === index ? "default" : "ghost"}
                size="sm"
                onClick={() => jumpToSegment(index)}
                className="shrink-0 text-xs"
              >
                <div className="text-left">
                  <div>{segment.startTime.formatted}</div>
                  <div className="text-xs opacity-70">{segment.title}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};