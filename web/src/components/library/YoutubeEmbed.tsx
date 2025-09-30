import React from 'react';
import { Youtube } from 'lucide-react';
import { extractYoutubeVideoId } from './utils';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url, title = "YouTube video" }) => {
  const videoId = extractYoutubeVideoId(url);
  
  if (!videoId) {
    return (
      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Youtube size={32} className="mx-auto mb-2" />
          <p className="text-sm">Invalid YouTube URL</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="w-full h-full"
        loading="lazy"
      />
    </div>
  );
};