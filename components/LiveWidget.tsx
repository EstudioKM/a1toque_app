import React from 'react';
import { MonitorPlay } from 'lucide-react';

interface LiveWidgetProps {
  videoUrl: string;
}

export const LiveWidget: React.FC<LiveWidgetProps> = ({ videoUrl }) => {
  // Helper to extract video ID and create embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // If the user pasted an entire iframe, extract the src
    const iframeMatch = url.match(/src="([^"]+)"/);
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1];
    }

    // If it's already an embed URL, return it
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Extract video ID from standard URL (watch?v=) or youtu.be
    let videoId = '';
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    } else if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
    
    return url; // Fallback
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <div className="mb-12 w-full bg-black/40 border border-red-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)] relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"></div>
      
      <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border-b border-red-500/20">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
        <h2 className="text-xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
          <MonitorPlay className="w-5 h-5 text-red-500" />
          EN VIVO AHORA
        </h2>
      </div>
      
      <div className="relative w-full aspect-video">
        <iframe 
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl} 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};
