
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { MovieDetail, ServerData, WatchHistoryItem, Movie } from '../types';
import { Loader, Badge, MovieCard, SectionTitle } from '../components/UI';
import { Play, Heart, Clock, Calendar, Globe, Share2, Facebook, MessageCircle, Copy, Check, Mic2, List, Users } from 'lucide-react';
import { storage } from '../utils/storage';

export const MovieDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [episodes, setEpisodes] = useState<ServerData[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [historyItem, setHistoryItem] = useState<WatchHistoryItem | undefined>(undefined);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeServerIndex, setActiveServerIndex] = useState(0);

  useEffect(() => {
    // Ensure page starts at top when movie changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    setIsFavorite(storage.isFavorite(slug));
    setHistoryItem(storage.getHistoryItem(slug));

    const loadData = async () => {
      try {
        // Updated API call aggregates all 3 sources (Main, OPhim, NguonC)
        const result = await api.getMovieDetail(slug);
        
        if (result.status && result.movie) {
          setMovie(result.movie);
          setEpisodes(result.episodes);
          
          const history = storage.getHistoryItem(slug);
          if (history && history.serverIndex !== undefined && history.serverIndex < result.episodes.length) {
              setActiveServerIndex(history.serverIndex);
          } else {
              setActiveServerIndex(0);
          }
          
          document.title = `${result.movie.name} (${result.movie.year}) - Hà Movie House`;

          if (result.movie.category && result.movie.category.length > 0) {
              // Fetch 25 items to buffer for filtering, then slice to 24 (LCM of 2,3,4,6)
              api.getMoviesByFilter('the-loai', result.movie.category[0].slug, 1, 25).then(res => {
                  const items = res.data?.items || res.items || [];
                  setSimilarMovies(items.filter((m: Movie) => m.slug !== slug).slice(0, 24));
              });
          }
        }
      } catch (err) {
        console.error("Error loading movie detail:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => { document.title = 'Hà Movie House - Xem Phim Online'; };
  }, [slug]);

  const cleanServerName = (name: string) => {
    const lower = name.toLowerCase();
    const isNguonC = name.includes('NguonC');
    const isOPhim = name.includes('OPhim');
    
    let label = '';
    
    // Map standard audio labels
    if (lower.includes('lồng tiếng')) label = 'Lồng Tiếng';
    else if (lower.includes('thuyết minh')) label = 'Thuyết Minh';
    else if (lower.includes('vietsub')) label = 'Vietsub';
    // Handle messy server names from providers
    else if (lower.includes('hà nội') || lower.includes('hồ chí minh') || lower.includes('server')) label = 'Vietsub';
    else label = name.replace('NguonC - ', '').replace('OPhim - ', '');

    // Nguồn Phụ 2 (OPhim) -> 2
    if (isOPhim) return `${label} 2`;
    // Nguồn Phụ 1 (NguonC) -> 3
    if (isNguonC) return `${label} 3`;
    
    // Nguồn Chính -> VIP
    return `${label} VIP`;
  };

  const toggleFav = () => {
    if (movie) {
      const added = storage.toggleFavorite(movie.slug);
      setIsFavorite(added);
    }
  };

  const shareFacebook = () => {
    const url = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareZalo = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return <Loader />;
  if (!movie) return <div className="text-center py-20 text-slate-500">Không tìm thấy phim</div>;

  const firstEpisode = episodes?.[activeServerIndex]?.server_data?.[0];
  const watchLink = historyItem && historyItem.episodeSlug 
    ? `/xem-phim/${movie.slug}/${historyItem.episodeSlug}${historyItem.serverIndex !== undefined ? `?sv=${historyItem.serverIndex}` : ''}`
    : (firstEpisode ? `/xem-phim/${movie.slug}/${firstEpisode.slug}?sv=${activeServerIndex}` : '#');
    
  const watchButtonText = historyItem ? `Tiếp tục: ${historyItem.episodeName}` : 'Xem Ngay';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="relative w-full h-auto min-h-[55vh] md:h-[40vh] rounded-3xl overflow-hidden mb-8 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-cover bg-center blur-md opacity-40" style={{ backgroundImage: `url(${getImageUrl(movie.poster_url)})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative z-10 h-full p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-end w-full pt-16 md:pt-10">
            <div className="hidden sm:block w-48 lg:w-60 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <img src={getImageUrl(movie.thumb_url)} alt={movie.name} className="w-full h-auto object-cover" />
            </div>
            <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400">{movie.name}</h1>
                <h2 className="text-lg md:text-xl text-slate-400 mb-6 font-medium">{movie.origin_name} ({movie.year})</h2>
                <div className="flex flex-wrap gap-2 mb-8">
                    <Badge color="yellow">{movie.quality}</Badge>
                    <Badge color="red">{movie.lang}</Badge>
                    {movie.category.map(c => <Badge key={c.id} color="blue">{c.name}</Badge>)}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-auto">
                     {firstEpisode ? (
                        <Link to={watchLink} className="flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                            <Play size={20} fill="currentColor" /> {watchButtonText}
                        </Link>
                     ) : (
                         <button disabled className="flex-1 sm:flex-none px-8 py-3.5 bg-slate-800 rounded-full text-slate-500 font-bold cursor-not-allowed">Đang cập nhật</button>
                     )}
                     <div className="flex items-center gap-2">
                        <button onClick={toggleFav} className={`p-3.5 rounded-full border transition-all ${isFavorite ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                            <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                        <div className="flex items-center bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 p-1">
                            <button onClick={shareFacebook} className="p-2.5 text-blue-400 hover:text-blue-300 transition-colors" title="Chia sẻ Facebook"><Facebook size={20} fill="currentColor" /></button>
                            <button onClick={shareZalo} className="p-2.5 text-sky-400 hover:text-sky-300 transition-colors" title="Chia sẻ Zalo"><MessageCircle size={20} fill="currentColor" /></button>
                            <button onClick={copyToClipboard} className={`p-2.5 transition-colors ${copySuccess ? 'text-green-500' : 'text-slate-400 hover:text-white'}`} title="Copy liên kết">{copySuccess ? <Check size={20} /> : <Copy size={20} />}</button>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                    Nội dung phim
                </h3>
                <div className="text-slate-300 leading-relaxed text-sm md:text-base" dangerouslySetInnerHTML={{ __html: movie.content }} />
            </div>

            {movie.actor && movie.actor.length > 0 && (
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-indigo-500" />
                        Diễn viên
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {movie.actor.map((a, i) => (
                            <div 
                                key={i} 
                                className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-lg text-sm font-medium"
                            >
                                {a}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 sticky top-24">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
                    <List size={20} className="text-indigo-500" />
                    <h3 className="text-lg font-bold text-white">Danh sách tập & Server</h3>
                </div>
                {episodes.length > 0 ? (
                    <div className="space-y-6">
                        {episodes.length > 1 && (
                            <div className="flex overflow-x-auto gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 scroll-smooth custom-scrollbar pb-2">
                                {episodes.map((server, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setActiveServerIndex(idx)}
                                        className={`flex-1 min-w-max py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                            activeServerIndex === idx 
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                            : 'text-slate-500 hover:text-slate-300 bg-slate-800/40 hover:bg-slate-800'
                                        }`}
                                    >
                                        <Mic2 size={12} />
                                        {cleanServerName(server.server_name)}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {episodes[activeServerIndex]?.server_data.map((ep) => (
                                <Link 
                                    key={ep.slug} 
                                    to={`/xem-phim/${movie.slug}/${ep.slug}?sv=${activeServerIndex}`} 
                                    className={`text-center py-3 px-1 rounded-xl text-sm font-bold transition-all border ${
                                        historyItem?.episodeSlug === ep.slug && historyItem?.serverIndex === activeServerIndex
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:bg-slate-700 hover:text-white hover:border-slate-600'
                                    }`}
                                >
                                    {ep.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 italic text-sm">Đang cập nhật tập phim...</div>
                )}
            </div>
        </div>
      </div>

      {similarMovies.length > 0 && (
        <div className="mt-16 pt-10 border-t border-slate-800">
            <SectionTitle>Phim tương tự</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similarMovies.map(m => <MovieCard key={m._id} movie={m} />)}
            </div>
        </div>
      )}
    </div>
  );
};
