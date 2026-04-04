
import React, { useEffect, useState, useRef } from 'react';
import { api, getImageUrl } from '../services/api';
import { Movie, WatchHistoryItem } from '../types';
import { storage } from '../utils/storage';
import { MovieCard, SectionTitle, Loader, MovieCardSkeleton } from '../components/UI';
import { Play, Info, ChevronRight, ChevronLeft, ArrowRight, Sparkles, MonitorPlay, Ghost, Zap, Heart, Flame, Clapperboard, Camera, Radio, Tv, AlertCircle, Star, Calendar, Layers, Clock } from 'lucide-react';
import { Link, useNavigationType } from 'react-router-dom';

// Persistent variable to store scroll position across navigations
let homePageScrollPos = 0;

const HeroSlider = ({ movies }: { movies: Movie[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  if (!movies.length) return null;

  return (
    <div className="relative w-full h-[85vh] md:h-screen overflow-hidden group">
        {movies.map((movie, index) => {
            const isActive = index === currentIndex;
            const bgImage = getImageUrl(movie.thumb_url || movie.poster_url);
            const posterImage = getImageUrl(movie.poster_url);

            return (
                <div 
                    key={movie._id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {/* Layer 1: Blurred cinematic background */}
                    <div 
                        className={`absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-linear ${isActive ? 'scale-[1.15]' : 'scale-105'}`}
                        style={{ 
                            backgroundImage: `url(${bgImage})`,
                            filter: 'blur(14px) brightness(0.45)',
                        }}
                    ></div>

                    {/* Layer 2: Sharp poster image on the right with mask fade */}
                    <div
                        className="absolute inset-0 hidden sm:block"
                        style={{
                            maskImage: 'linear-gradient(to left, black 35%, transparent 75%)',
                            WebkitMaskImage: 'linear-gradient(to left, black 35%, transparent 75%)',
                        }}
                    >
                        <img
                            src={posterImage}
                            alt={movie.name}
                            className={`absolute right-0 h-full object-cover object-top transition-all duration-1000 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                            style={{ width: '62%' }}
                            decoding="async"
                        />
                    </div>
                    {/* Poster edge blur overlay */}
                    <div className="absolute inset-0 hidden sm:block pointer-events-none" style={{
                        background: 'linear-gradient(to right, transparent 30%, rgba(15,23,42,0.15) 50%, transparent 70%)',
                        backdropFilter: 'blur(0px)',
                    }}></div>

                    {/* Layer 3: Gradient overlays for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/55 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20"></div>
                    
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-center px-4 md:pl-[2.5cm] md:pr-12">
                        <div className="max-w-7xl w-full">
                             <div className={`max-w-3xl transition-all duration-1000 delay-300 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-indigo-600/30">
                                        <span className="animate-pulse">●</span> PHIM MỚI NỔI BẬT
                                    </span>
                                </div>

                                {movie.logo_url ? (
                                    <div className="mb-8 relative max-w-[85%] md:max-w-xl">
                                        <img 
                                            src={getImageUrl(movie.logo_url)} 
                                            alt={movie.name} 
                                            className="w-full h-auto drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] filter brightness-110 contrast-110" 
                                            decoding="async"
                                        />
                                        <div className="absolute -inset-6 blur-3xl bg-indigo-500/5 -z-10 rounded-full opacity-30"></div>
                                    </div>
                                ) : (
                                    <div className="mb-8 relative">
                                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-2 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)] uppercase tracking-tight">
                                            {movie.name}
                                        </h1>
                                        <div className="absolute -inset-1 blur-2xl bg-indigo-500/10 -z-10 rounded-full opacity-50"></div>
                                    </div>
                                )}
                                
                                <p className="text-slate-300 text-lg md:text-xl mb-10 line-clamp-2 drop-shadow-md font-bold max-w-2xl tracking-wide opacity-95">
                                    {movie.origin_name} <span className="text-indigo-400 ml-2">({movie.year})</span>
                                </p>
                                
                                <div className="flex items-center gap-3 md:gap-4">
                                    <Link 
                                        to={`/phim/${movie.slug}`} 
                                        className="px-6 py-3.5 md:px-10 md:py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 rounded-full font-black flex items-center justify-center gap-2.5 hover:shadow-amber-500/50 transition-all shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 group/btn"
                                    >
                                        <Play size={20} className="md:size-6 fill-slate-900 group-hover/btn:scale-110 transition-transform" /> 
                                        <span className="text-sm md:text-base">XEM NGAY</span>
                                    </Link>
                                    <Link 
                                        to={`/phim/${movie.slug}`} 
                                        className="w-14 h-14 md:w-auto md:h-auto md:px-10 md:py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-black flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95 group/info"
                                    >
                                        <Info size={28} className="md:size-6" />
                                        <span className="hidden md:inline">CHI TIẾT</span>
                                    </Link>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}

        {/* Mobile: prev/next arrows only */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md border border-white/10 transition-all md:hidden active:scale-90">
            <ChevronLeft size={22} />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md border border-white/10 transition-all md:hidden active:scale-90">
            <ChevronRight size={22} />
        </button>

        {/* Desktop: thumbnail strip with integrated prev/next at bottom-right */}
        <div className="absolute bottom-10 right-6 z-20 hidden md:flex items-center gap-3">
            <button
                onClick={prevSlide}
                className="w-11 h-20 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-indigo-600/80 hover:border-indigo-500 transition-all active:scale-90 flex-shrink-0"
            >
                <ChevronLeft size={22} />
            </button>
            {movies.map((movie, index) => (
                <button
                    key={movie._id}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative overflow-hidden rounded-xl transition-all duration-300 flex-shrink-0 ${
                        index === currentIndex
                            ? 'w-32 h-20 ring-2 ring-indigo-400 ring-offset-2 ring-offset-black/50 scale-105'
                            : 'w-28 h-[72px] opacity-50 hover:opacity-80 hover:scale-105'
                    }`}
                >
                    <img
                        src={getImageUrl(movie.thumb_url || movie.poster_url)}
                        alt={movie.name}
                        className="w-full h-full object-cover"
                        decoding="async"
                    />
                    {index === currentIndex && (
                        <div className="absolute inset-0 bg-indigo-500/20" />
                    )}
                </button>
            ))}
            <button
                onClick={nextSlide}
                className="w-11 h-20 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-indigo-600/80 hover:border-indigo-500 transition-all active:scale-90 flex-shrink-0"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    </div>
  );
};

// --- THEMATIC COMPONENTS ---

const ProfessionalHero: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block w-full h-full overflow-hidden rounded-[3rem] bg-slate-900 border border-white/10 shadow-2xl transition-all duration-700">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-1000 group-hover:scale-105" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-white text-slate-950 text-[10px] font-black uppercase rounded shadow-lg">MỚI NHẤT</span>
                <span className="px-3 py-1 bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase rounded">{movie.quality}</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl group-hover:text-indigo-400 transition-colors">
                {movie.name}
            </h3>
            <p className="text-slate-400 font-bold text-sm md:text-lg uppercase tracking-widest max-w-xl line-clamp-1">
                {movie.origin_name} <span className="text-indigo-500/60 ml-2">|</span> <span className="ml-2">{movie.year}</span>
            </p>
        </div>
        
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-500 shadow-2xl">
            <Play size={32} fill="currentColor" className="ml-1" />
        </div>
    </Link>
);

const PremiumSingleCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block aspect-[2/3] overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/5 hover:ring-indigo-500/50 transition-all duration-500 shadow-2xl">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="absolute top-3 left-3">
             <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Movie</span>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-5 transform transition-all duration-500 group-hover:-translate-y-1">
            <h4 className="text-white font-black text-sm leading-tight uppercase tracking-tight line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{movie.name}</h4>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span>{movie.year}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="text-indigo-400">{movie.quality || 'HD'}</span>
            </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                <Play size={24} fill="currentColor" />
            </div>
        </div>
    </Link>
);

const LibrarySeriesCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block aspect-[2/3] transition-all duration-500 hover:-translate-y-2">
        {/* Collection Stacks */}
        <div className="absolute -inset-1 bg-indigo-500/10 rounded-2xl translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
        <div className="absolute -inset-1 bg-slate-800/40 rounded-2xl translate-x-2 translate-y-2 -z-20 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform opacity-50"></div>
        
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-2xl">
            <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-transparent to-transparent"></div>
            
            <div className="absolute top-3 right-3">
                <div className="px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded shadow-lg flex items-center gap-1">
                    <Layers size={10} /> Series
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4">
                <h4 className="text-white font-black text-xs uppercase tracking-tight leading-tight line-clamp-2 mb-2">{movie.name}</h4>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">{movie.year}</span>
                    <div className="h-5 px-2 bg-white/10 backdrop-blur-sm rounded-md flex items-center justify-center text-[8px] text-white font-black uppercase">
                        {movie.episode_current || 'TV'}
                    </div>
                </div>
            </div>
        </div>
    </Link>
);

const AnimationBubbleCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block w-full aspect-[2/3] overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-2">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-transparent to-transparent"></div>
        <div className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
            <Star size={14} fill="currentColor" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-5">
            <h4 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2 leading-tight">{movie.name}</h4>
            <div className="mt-2 h-1 w-0 group-hover:w-full bg-gradient-to-r from-indigo-400 to-cyan-400 transition-all duration-500"></div>
        </div>
    </Link>
);

const TVShowDigitalCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block w-full aspect-[4/5] overflow-hidden rounded-2xl bg-slate-900 border border-indigo-500/20 hover:border-indigo-400 transition-all duration-500 shadow-lg hover:shadow-indigo-500/30">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-600/80 backdrop-blur-sm rounded-md shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            <span className="text-[9px] font-black text-white tracking-widest uppercase">ON AIR</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-tight line-clamp-2 drop-shadow-md">{movie.name}</h4>
            <p className="text-indigo-400 text-[10px] font-black uppercase mt-1 tracking-widest">{movie.episode_current || 'TV SERIES'}</p>
        </div>
    </Link>
);

const CNAnimationInkCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block w-full aspect-[2/3] overflow-hidden rounded-tr-[3rem] rounded-bl-[3rem] bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/50 transition-all duration-500">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6">
            <h4 className="text-white font-bold text-lg leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-2">{movie.name}</h4>
            <p className="text-indigo-500 text-[10px] font-black tracking-[0.2em] uppercase mt-2">Trung Hoa Kỳ Nghệ</p>
        </div>
    </Link>
);

const ChildhoodPolaroidCard: React.FC<{ movie: Movie, index: number }> = ({ movie, index }) => {
    const rotations = [
        'rotate-[3deg]', 
        'rotate-[-4deg]', 
        'rotate-[2deg]', 
        'rotate-[-3deg]', 
        'rotate-[5deg]', 
        'rotate-[-2deg]'
    ];
    const rotation = rotations[index % rotations.length];
    
    return (
        <Link to={`/phim/${movie.slug}`} className={`group block relative p-3 pb-12 bg-white shadow-2xl transition-all duration-500 hover:scale-110 hover:z-10 hover:rotate-0 ${rotation} border border-slate-200`}>
            <div className="aspect-[4/5] overflow-hidden bg-slate-100 relative">
                <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" decoding="async" />
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            </div>
            <div className="mt-4 px-1 text-center">
                <h4 className="text-slate-900 font-black text-sm leading-tight line-clamp-1 italic uppercase tracking-tighter">{movie.name}</h4>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="h-px w-4 bg-slate-300"></div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{movie.year}</p>
                    <div className="h-px w-4 bg-slate-300"></div>
                </div>
            </div>
        </Link>
    );
};

const SpotlightMovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-2xl transition-all duration-500 hover:scale-[1.02]">
        <img src={getImageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-red-600 text-[10px] font-black text-white uppercase tracking-widest rounded shadow-lg shadow-red-600/20">RẠP</span>
                <span className="text-white/60 text-xs font-bold">{movie.year}</span>
            </div>
            <h4 className="text-white font-black text-xl uppercase tracking-tighter line-clamp-1 group-hover:text-red-500 transition-colors">{movie.name}</h4>
        </div>
    </Link>
);

const HKMovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block aspect-[2/3] overflow-hidden rounded-lg bg-black ring-1 ring-red-500/30 hover:ring-red-500 transition-all duration-500">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 w-full">
            <h4 className="text-white text-sm font-black uppercase tracking-tighter line-clamp-1 group-hover:text-red-400">{movie.name}</h4>
        </div>
    </Link>
);

const TVBClassicCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-amber-600/30 hover:border-amber-500 transition-all duration-500 shadow-lg hover:shadow-amber-500/20">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover sepia-[0.1] group-hover:sepia-0 transition-all duration-700" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-2 left-2 flex gap-1.5">
            <div className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded italic shadow-md">TVB CLASSIC</div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4">
            <h4 className="text-white font-black text-sm uppercase tracking-tighter leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">{movie.name}</h4>
            <p className="text-amber-500/70 text-[10px] font-bold mt-1 uppercase tracking-widest">{movie.year}</p>
        </div>
    </Link>
);

const KMovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Link to={`/phim/${movie.slug}`} className="group relative block w-full aspect-[2/3] overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-700 hover:-translate-y-2">
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <h4 className="text-white group-hover:text-slate-900 font-bold text-lg leading-tight transition-colors line-clamp-2">{movie.name}</h4>
            <p className="text-indigo-400 text-xs mt-1 font-black uppercase tracking-widest">K-Selection</p>
        </div>
    </Link>
);

const ThaiMovieCard: React.FC<{ movie: Movie, index: number }> = ({ movie, index }) => (
    <Link to={`/phim/${movie.slug}`} className={`group relative block w-full aspect-[3/4] overflow-hidden rounded-3xl transition-all duration-700 hover:scale-105 shadow-xl ${index % 2 === 0 ? '' : 'translate-y-8 md:translate-y-12'}`}>
        <img src={getImageUrl(movie.poster_url)} alt={movie.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" decoding="async" />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-rose-950/90 to-transparent backdrop-blur-[2px]">
            <h4 className="text-white font-black text-sm uppercase text-center line-clamp-2 tracking-tighter leading-tight">{movie.name}</h4>
            <p className="text-[8px] text-rose-300 font-bold text-center uppercase tracking-widest mt-1">Siam Choice</p>
        </div>
    </Link>
);

const CategoryButton: React.FC<{ to: string, variant: 'neon' | 'ticket' | 'ink' | 'cyber' | 'tag' | 'silk' | 'glass' | 'gold' }> = ({ to, variant }) => {
    const styles = {
        neon: "bg-transparent border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-lg",
        ticket: "bg-red-600 text-white relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-3 before:h-3 before:bg-slate-950 before:rounded-full after:content-[''] after:absolute after:right-0 after:top-1/2 after:translate-x-1/2 after:-translate-y-1/2 after:w-3 after:h-3 after:bg-slate-950 after:rounded-full overflow-hidden",
        ink: "bg-slate-900 border-b-4 border-indigo-700 text-indigo-400 italic hover:border-b-2 hover:translate-y-0.5",
        cyber: "bg-slate-900 border-l-4 border-emerald-500 text-emerald-400 skew-x-[-12deg] hover:bg-emerald-500 hover:text-slate-950",
        tag: "bg-[#f3e5ab] text-slate-800 border-2 border-dashed border-slate-400 hover:rotate-2",
        silk: "bg-rose-100 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white",
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20",
        gold: "bg-amber-600/20 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
    };

    return (
        <Link to={to} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg ${styles[variant]}`}>
            <ArrowRight size={20} />
        </Link>
    );
};

const ScrollableSection = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth / 1.5 : current.offsetWidth / 1.5;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    return (
        <div className="relative group">
            <button onClick={() => scroll('left')} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/50 hover:bg-indigo-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hidden md:flex shadow-xl border border-white/10"><ChevronLeft size={28} /></button>
            <div ref={scrollRef} className={className}>{children}</div>
            <button onClick={() => scroll('right')} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-black/50 hover:bg-indigo-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hidden md:flex shadow-xl border border-white/10"><ChevronRight size={28} /></button>
        </div>
    );
};

export const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const navType = useNavigationType();

  // Helper to get a rotational page number based on the current date
  const getDailyPage = (maxPage: number) => {
    const today = new Date();
    const day = today.getDate(); // 1-31
    // (day % maxPage) will give 0 to maxPage-1. Add 1 to get 1 to maxPage.
    return (day % maxPage) + 1;
  };

  // Helper to get a rotational year for "Childhood" section based on date
  const getChildhoodYear = () => {
    const today = new Date();
    const day = today.getDate(); // 1-31
    // Rotate between 2000 and 2012
    const startYear = 2000;
    const range = 13; // 2012 - 2000 + 1
    return (startYear + (day % range)).toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      // Increased maxPage rotation to ensure "New Movies Every Day" feel
      const childhoodYear = getChildhoodYear();
      const koreanPage = getDailyPage(10);
      const hongkongPage = getDailyPage(12);
      const thaiPage = getDailyPage(10);
      const tvbPage = getDailyPage(6);
      const animPage = getDailyPage(10);
      const cnAnimPage = getDailyPage(8);
      const showPage = getDailyPage(8);
      const cinemaPage = getDailyPage(4);
      const singlesPage = getDailyPage(15);
      const seriesPage = getDailyPage(15);

      const endpoints = [
        { key: 'news', fn: () => api.getNewUpdates(1) },
        { key: 'cinema', fn: () => api.getMoviesByType('phim-chieu-rap', 6, cinemaPage) },
        { key: 'singles', fn: () => api.getMoviesByType('phim-le', 12, singlesPage) },
        { key: 'series', fn: () => api.getMoviesByType('phim-bo', 12, seriesPage) },
        { key: 'animations', fn: () => api.getMoviesByType('hoat-hinh', 12, animPage) },
        { key: 'anime', fn: () => api.getMoviesByType('hoat-hinh', 12, animPage, '', 'nhat-ban') },
        { key: 'chineseAnim', fn: () => api.getMoviesByType('hoat-hinh', 12, cnAnimPage, '', 'trung-quoc') },
        { key: 'korean', fn: () => api.getMoviesByFilter('quoc-gia', 'han-quoc', koreanPage, 12) },
        { key: 'hongkong', fn: () => api.getMoviesByType('phim-le', 12, hongkongPage, '', 'hong-kong') },
        { key: 'tvb', fn: () => api.getMoviesByType('phim-bo', 12, tvbPage, '', 'hong-kong', '', 'long-tieng') },
        { key: 'thai', fn: () => api.getMoviesByFilter('quoc-gia', 'thai-lan', thaiPage, 12) },
        { key: 'tvshows', fn: () => api.getMoviesByType('tv-shows', 12, showPage) },
        { key: 'childhood', fn: () => api.getMoviesByType('hoat-hinh', 12, 1, '', '', childhoodYear) }
      ];

      const results = await Promise.allSettled(endpoints.map(e => e.fn()));
      
      const newData: any = {};
      const newErrors: any = {};

      results.forEach((res, idx) => {
          const key = endpoints[idx].key;
          if (res.status === 'fulfilled') {
              const items = res.value.data?.items || res.value.items || [];
              newData[key] = items;
          } else {
              newErrors[key] = true;
          }
      });

      setData(newData);
      setErrors(newErrors);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handle scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
        homePageScrollPos = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect navigation type to decide whether to restore or reset scroll
  useEffect(() => {
    if (navType === 'PUSH') {
        homePageScrollPos = 0;
    }
  }, [navType]);

  useEffect(() => {
    // Only restore scroll if it's a POP navigation (Back button)
    if (!loading && navType === 'POP' && homePageScrollPos > 0) {
        const timer = setTimeout(() => {
            window.scrollTo({ top: homePageScrollPos, behavior: 'auto' });
        }, 150);
        return () => clearTimeout(timer);
    } else if (!loading && (navType === 'PUSH' || homePageScrollPos === 0)) {
        window.scrollTo(0, 0);
    }
  }, [loading, navType]);

  const renderSection = (key: string, title: string, path: string, variant: any, CardComp: any, isScrollable = false) => {
    if (errors[key]) return (
        <div className="mb-24 p-10 bg-slate-900/30 rounded-3xl border border-red-500/10 flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="mb-2 text-red-500" />
            <p>Mục này hiện không khả dụng. <button onClick={() => window.location.reload()} className="text-indigo-400 font-bold hover:underline">Thử lại</button></p>
        </div>
    );

    const items = data[key] || [];
    const isLocalLoading = loading && items.length === 0;

    return (
        <section className="mb-24 content-auto">
            <div className="flex items-center justify-between mb-10">
                <SectionTitle>{title}</SectionTitle>
                <CategoryButton to={path} variant={variant} />
            </div>
            {isScrollable ? (
                <ScrollableSection className="flex gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
                    {isLocalLoading ? [...Array(6)].map((_, i) => <div key={i} className="min-w-[200px]"><MovieCardSkeleton /></div>) : 
                     items.map((m: any, idx: number) => <div key={m._id} className="min-w-[200px]"><CardComp movie={m} index={idx} /></div>)}
                </ScrollableSection>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {isLocalLoading ? [...Array(12)].map((_, i) => <MovieCardSkeleton key={i} />) : 
                     items.map((m: any, idx: number) => <CardComp key={m._id} movie={m} index={idx} />)}
                </div>
            )}
        </section>
    );
  };

  return (
    <div className="animate-in fade-in duration-700 pb-4">
      {loading ? <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader /></div> : <HeroSlider movies={data.news?.slice(0, 5) || []} />}
      
      <div className="mx-auto px-4 md:px-[3cm] mt-12 md:mt-6 relative z-10">
          
          {/* 1. PHIM MỚI CẬP NHẬT - PROFESSIONAL SPOTLIGHT GRID */}
          <section className="mb-24 content-auto">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
                        <Zap size={24} />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Phim Mới Cập NHật</h2>
                </div>
                <CategoryButton to="/danh-sach/phim-moi" variant="neon" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Large Featured Spotlight */}
                <div className="lg:col-span-8 aspect-[16/9] lg:aspect-auto">
                    {loading ? <MovieCardSkeleton /> : (data.news?.[0] && <ProfessionalHero movie={data.news[0]} />)}
                </div>
                {/* Hot Picks Sidebar */}
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
                    {loading ? (
                        [...Array(4)].map((_, i) => <MovieCardSkeleton key={i} />)
                    ) : (
                        data.news?.slice(1, 5).map((movie: any) => (
                            <Link key={movie._id} to={`/phim/${movie.slug}`} className="group flex items-center gap-4 bg-slate-900/40 hover:bg-slate-900 border border-white/5 p-3 rounded-2xl transition-all">
                                <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                    <img src={getImageUrl(movie.thumb_url)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" decoding="async" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-black text-sm uppercase line-clamp-1 group-hover:text-indigo-400 transition-colors">{movie.name}</h4>
                                    <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{movie.year} • {movie.quality}</p>
                                    <div className="mt-2 flex items-center gap-1.5 text-indigo-500">
                                        <Play size={10} fill="currentColor" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Xem ngay</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
          </section>

          {/* LỊCH SỬ XEM PHIM */}
          {(() => {
            const h = storage.getHistory();
            const historyItems = Object.values(h).sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 10);
            if (historyItems.length === 0) return null;
            return (
              <section className="mb-24 content-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                      <Clock size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Xem Gần Đây</h2>
                  </div>
                  <Link to="/lich-su" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg bg-transparent border-2 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white">
                    <ArrowRight size={20} />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                  {historyItems.map(item => (
                    <Link key={item.slug} to={`/xem-phim/${item.slug}/${item.episodeSlug}${item.serverIndex !== undefined ? `?sv=${item.serverIndex}` : ''}`} className="group flex-shrink-0 w-36 sm:w-44 snap-start">
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-3">
                        <img src={getImageUrl(item.poster_url)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/90 text-white text-[9px] font-black uppercase rounded-md">
                            <Play size={8} fill="currentColor" /> {item.episodeName}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                            <Play size={20} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-white font-bold text-xs line-clamp-2 group-hover:text-amber-400 transition-colors leading-tight">{item.name}</h4>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* 2. PHIM CHIẾU RẠP - BALANCED 3 COLUMN (Synced to 6 items) */}
          <section className="mb-24 content-auto">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
                        <MonitorPlay size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Phim Chiếu Rạp</h2>
                </div>
                <CategoryButton to="/danh-sach/phim-chieu-rap" variant="ticket" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {loading ? (
                    [...Array(3)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    data.cinema?.slice(0, 6).map((movie: any) => <SpotlightMovieCard key={movie._id} movie={movie} />)
                )}
            </div>
          </section>

          {renderSection('singles', 'Kho Phim Lẻ', '/danh-sach/phim-le', 'glass', PremiumSingleCard)}
          {renderSection('series', 'Phim Bộ Đặc Sắc', '/danh-sach/phim-bo', 'glass', LibrarySeriesCard)}
          
          {/* 3. PHIM TUỔI THƠ - ENHANCED TILT POLAROIDS */}
          <section className="mb-24 px-4 py-16 bg-slate-900/10 rounded-[4rem] border border-white/5 content-auto">
            <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-4">
                    <Sparkles size={32} className="text-yellow-400" />
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Ký Ức Tuổi Thơ</h2>
                </div>
                <CategoryButton to="/danh-sach/hoat-hinh?year=2005" variant="tag" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-16">
                {loading ? (
                    [...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    data.childhood?.slice(0, 12).map((movie: any, idx: number) => <ChildhoodPolaroidCard key={movie._id} movie={movie} index={idx} />)
                )}
            </div>
          </section>

          {renderSection('korean', 'K-Romance', '/danh-sach/phim-bo?country=han-quoc', 'silk', KMovieCard, true)}
          {renderSection('animations', 'Phim Hoạt Hình', '/danh-sach/hoat-hinh', 'glass', AnimationBubbleCard)}
          {renderSection('chineseAnim', 'Hoạt Hình Trung Quốc', '/danh-sach/hoat-hinh?country=trung-quoc', 'ink', CNAnimationInkCard)}
          {renderSection('anime', 'Thế giới Anime', '/danh-sach/hoat-hinh?country=nhat-ban', 'cyber', MovieCard, true)}
          
          {/* 4. PHIM TVB - NOSTALGIC AMBER (Synced to 12 items) */}
          <section className="mb-24 py-16 px-8 bg-amber-950/10 rounded-[4rem] border border-amber-500/10 relative overflow-hidden content-auto">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] rotate-3">
                        <Tv size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-amber-500 uppercase tracking-tighter italic">Huyền Thoại TVB</h2>
                        <p className="text-amber-600/60 text-xs font-black uppercase tracking-[0.4em] mt-1">Ký Ức Hoàng Kim</p>
                    </div>
                </div>
                <CategoryButton to="/danh-sach/phim-bo?country=hong-kong&lang=long-tieng" variant="gold" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 relative z-10">
              {loading ? (
                  [...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)
              ) : (
                  data.tvb?.slice(0, 12).map((movie: any) => <TVBClassicCard key={movie._id} movie={movie} />)
              )}
            </div>
          </section>

          {/* 5. HONG KONG NOIR - GRITTY RED (Synced to 12 items) */}
          <section className="mb-24 p-10 bg-black rounded-[3rem] border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] content-auto">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <Flame size={32} className="text-red-500" />
                    <h2 className="text-4xl font-black text-red-500 uppercase tracking-widest italic">Hong Kong Noir</h2>
                </div>
                <CategoryButton to="/danh-sach/phim-le?country=hong-kong" variant="glass" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    data.hongkong?.slice(0, 12).map((movie: any) => <HKMovieCard key={movie._id} movie={movie} />)
                )}
            </div>
          </section>

          {/* 6. PHIM THÁI - STAGGERED FLOW */}
          <section className="mb-24 pt-10 content-auto">
            <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-3">
                    <Radio size={32} className="text-rose-500" />
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Thai Dynamic</h2>
                </div>
                <CategoryButton to="/danh-sach/phim-le?country=thai-lan" variant="silk" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-20 md:gap-x-10">
                {loading ? (
                    [...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    data.thai?.slice(0, 12).map((movie: any, idx: number) => <ThaiMovieCard key={movie._id} movie={movie} index={idx} />)
                )}
            </div>
          </section>

          {/* Last Section with smaller margin */}
          <div className="mb-12 content-auto">
            {renderSection('tvshows', 'TV Shows & Reality', '/danh-sach/tv-shows', 'glass', TVShowDigitalCard)}
          </div>
      </div>
    </div>
  );
};
