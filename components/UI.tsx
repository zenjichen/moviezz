
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Clock } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { Movie } from '../types';

export const Loader: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl animate-pulse"></div>
      <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
    </div>
  </div>
);

export const MovieCardSkeleton: React.FC = () => (
  <div className="relative aspect-[2/3] rounded-xl bg-slate-900 border border-white/5 animate-pulse overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
    </div>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
    <span className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full block"></span>
    {children}
  </h2>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: 'blue' | 'red' | 'yellow' }> = ({ children, color = 'blue' }) => {
  const styles = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
    red: 'bg-red-500/20 text-red-300 border-red-500/20',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[color]} backdrop-blur-md`}>
      {children}
    </span>
  );
};

export const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);
  
  return (
    <Link to={`/phim/${movie.slug}`} className="group block relative h-full">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 shadow-lg ring-1 ring-white/5 transition-all duration-300 group-hover:shadow-indigo-500/20 group-hover:scale-[1.02] group-hover:ring-indigo-500/50">
        {/* Image - Optimized for performance */}
        <img 
          src={imageUrl} 
          alt={movie.name} 
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Overlay Gradient - Stronger at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90" />

        {/* Top Left Year Badge */}
        <div className="absolute top-2 left-2 z-20">
             <span className="text-[11px] font-medium text-slate-300 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded border border-slate-700 shadow-sm">
                {movie.year}
             </span>
        </div>

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 backdrop-blur-sm transform group-hover:scale-110 transition-transform">
            <Play size={20} className="fill-white text-white ml-1" />
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1.5">
          {/* Title */}
          <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {movie.name}
          </h3>
          
          {/* Original Name */}
          <p className="text-slate-400 text-xs line-clamp-1 font-medium">{movie.origin_name}</p>
          
          {/* Language Badge */}
          <div className="mt-1">
            {(movie.lang || movie.quality) && (
                 <p className="text-[11px] font-bold text-yellow-400 border border-yellow-600/40 bg-yellow-900/10 px-2 py-0.5 rounded w-fit max-w-full truncate">
                    {movie.lang || movie.quality}
                 </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};