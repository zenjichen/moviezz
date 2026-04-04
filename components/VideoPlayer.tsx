
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  startTime?: number; // seconds
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  fallbackSrc,
  poster, 
  autoPlay = false, 
  onEnded, 
  onTimeUpdate,
  startTime = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Detection
  const isEmbed = src.includes('http') && 
                  !src.toLowerCase().includes('.m3u8') && 
                  !src.toLowerCase().includes('.mp4');

  useEffect(() => {
    if (isEmbed || !videoRef.current || isUsingFallback) return;

    const video = videoRef.current;
    const handleTimeUpdate = () => {
      if (onTimeUpdate) onTimeUpdate(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', () => onEnded && onEnded());

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({ startPosition: startTime, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHasError(false);
        if (autoPlay) video.play().catch(e => console.log("Autoplay blocked", e));
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn("HLS Fatal Error:", data.type);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
          } else {
              setHasError(true);
              if (fallbackSrc) {
                  console.log("Switching to fallback embed...");
                  setIsUsingFallback(true);
              }
              hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.currentTime = startTime;
      video.addEventListener('loadedmetadata', () => { if (autoPlay) video.play(); });
      video.onerror = () => {
          if (fallbackSrc) setIsUsingFallback(true);
          setHasError(true);
      };
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', () => onEnded && onEnded());
    };
  }, [src, autoPlay, startTime, isEmbed, isUsingFallback, fallbackSrc]);

  if (isEmbed || isUsingFallback) {
    const finalUrl = isUsingFallback ? (fallbackSrc || src) : src;
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        {isUsingFallback && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-yellow-500/90 text-slate-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={14} /> Link hỏng - Đã tự động đổi nguồn dự phòng
            </div>
        )}
        <iframe
          src={finalUrl}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50 group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        poster={poster}
        playsInline
      />
      {hasError && !fallbackSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-30">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <p className="text-white font-bold mb-4">Lỗi phát Video. Server đang bận.</p>
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-full text-white font-bold hover:bg-indigo-500 transition-all">
                  <RefreshCw size={20} /> Tải lại trang
              </button>
          </div>
      )}
    </div>
  );
};
