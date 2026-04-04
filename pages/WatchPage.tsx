
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { MovieDetail, ServerData, Episode, Movie } from '../types';
import { Loader, MovieCard, SectionTitle } from '../components/UI';
import { VideoPlayer } from '../components/VideoPlayer';
import { storage } from '../utils/storage';
import { ChevronLeft, ChevronRight, List, Settings, Mic2, Play, X } from 'lucide-react';

export const WatchPage = () => {
  const { slug, episodeSlug } = useParams<{ slug: string; episodeSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [serverList, setServerList] = useState<ServerData[]>([]);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  
  const lastSavedTime = useRef(0);

  useEffect(() => {
    // Scroll to top whenever episodeSlug changes to focus on the video player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [episodeSlug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const loadData = async () => {
      try {
        // Use aggregated API to get data from all sources
        const result = await api.getMovieDetail(slug);
        
        if (result.status && result.movie) {
          setMovie(result.movie);
          setServerList(result.episodes);
          document.title = `Xem phim ${result.movie.name} - Tập ${episodeSlug} - Hà Movie House`;

          const svParam = searchParams.get('sv');
          if (svParam !== null) {
              const pIdx = parseInt(svParam);
              if (!isNaN(pIdx) && pIdx >= 0 && pIdx < result.episodes.length) setActiveServerIndex(pIdx);
          } else {
              const history = storage.getHistoryItem(slug);
              if (history && history.serverIndex !== undefined && history.serverIndex < result.episodes.length) setActiveServerIndex(history.serverIndex);
          }

          // Fetch 13 items to buffer for filtering, then slice to 12 (LCM of 2,3,4,6)
          api.getMoviesByType('phim-moi', 13).then(recRes => {
              const items = recRes.data?.items || recRes.items || [];
              setRecommendedMovies(items.filter((m: Movie) => m.slug !== slug).slice(0, 12));
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => { document.title = 'Hà Movie House - Xem Phim Online'; };
  }, [slug, episodeSlug, searchParams]);

  useEffect(() => {
    if (serverList.length === 0) return;
    const currentServerData = serverList[activeServerIndex]?.server_data || [];
    if (episodeSlug) {
      const ep = currentServerData.find(e => e.slug === episodeSlug);
      if (ep) setCurrentEpisode(ep);
      else if (currentServerData.length > 0) navigate(`/xem-phim/${slug}/${currentServerData[0].slug}?sv=${activeServerIndex}`, { replace: true });
    }
  }, [episodeSlug, activeServerIndex, serverList, slug, navigate]);

  const handleTimeUpdate = (currentTime: number) => {
    if (!movie || !currentEpisode) return;
    const now = Date.now();
    if (now - lastSavedTime.current > 5000) {
        storage.saveHistory({
            slug: movie.slug,
            name: movie.name,
            poster_url: movie.thumb_url,
            episodeSlug: currentEpisode.slug,
            episodeName: currentEpisode.name,
            timestamp: currentTime,
            lastUpdated: now,
            serverIndex: activeServerIndex
        });
        lastSavedTime.current = now;
    }
  };

  const handleEnded = () => {
    // Auto-next functionality removed as per request
    console.log("Video ended. User will manually select next episode.");
  };

  const cleanServerName = (name: string) => {
    const lower = name.toLowerCase();
    const isNguonC = name.includes('NguonC');
    const isOPhim = name.includes('OPhim');
    
    let label = '';
    
    if (lower.includes('lồng tiếng')) label = 'Lồng Tiếng';
    else if (lower.includes('thuyết minh')) label = 'Thuyết Minh';
    else if (lower.includes('vietsub')) label = 'Vietsub';
    else if (lower.includes('hà nội') || lower.includes('hồ chí minh') || lower.includes('server')) label = 'Vietsub';
    else label = name.replace('NguonC - ', '').replace('OPhim - ', '');

    // Nguồn Phụ 2 (OPhim) -> 2
    if (isOPhim) return `${label} 2`;
    // Nguồn Phụ 1 (NguonC) -> 3
    if (isNguonC) return `${label} 3`;
    
    // Nguồn Chính -> VIP
    return `${label} VIP`;
  };

  if (loading) return <Loader />;
  if (!movie || !currentEpisode) return <div className="text-center pt-20">Không tìm thấy tập phim.</div>;

  const currentServerData = serverList[activeServerIndex]?.server_data || [];
  const currentIndex = currentServerData.findIndex(e => e.slug === currentEpisode.slug);
  const prevEp = currentIndex > 0 ? currentServerData[currentIndex - 1] : null;
  const nextEp = currentIndex < currentServerData.length - 1 ? currentServerData[currentIndex + 1] : null;

  const history = storage.getHistoryItem(movie.slug);
  const startTime = (history && history.episodeSlug === currentEpisode.slug) ? history.timestamp : 0;
  
  // Logic lựa chọn nguồn phát
  const serverName = serverList[activeServerIndex]?.server_name || '';
  const isNguonC = serverName.includes('NguonC');
  
  // Nguồn C bắt buộc dùng Embed. Các nguồn khác ưu tiên m3u8.
  const playerSrc = isNguonC 
    ? currentEpisode.link_embed 
    : (currentEpisode.link_m3u8 || currentEpisode.link_embed);
  
  const fallbackSrc = currentEpisode.link_embed;

  return (
    <div className="relative pb-20">
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative z-10">
        <div className="w-full">
           <div className="mb-4 flex items-center justify-between text-sm text-slate-400 px-1">
               <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <Link to={`/phim/${slug}`} className="hover:text-indigo-400 font-medium truncate max-w-[66vw] sm:max-w-md">{movie.name}</Link>
                    <span className="flex-shrink-0">/</span>
                    <span className="text-white font-bold flex-shrink-0">Tập {currentEpisode.name}</span>
               </div>
           </div>

           <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6">
               <VideoPlayer 
                key={`${activeServerIndex}-${currentEpisode.slug}`} 
                src={playerSrc} 
                fallbackSrc={fallbackSrc}
                poster={movie.poster_url} 
                autoPlay={true} 
                startTime={startTime} 
                onTimeUpdate={handleTimeUpdate} 
                onEnded={handleEnded} 
               />
           </div>

           <div className="flex flex-col gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 mt-6">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   <div>
                       <h1 className="text-lg md:text-xl font-bold text-white mb-1">{movie.name} - Tập {currentEpisode.name}</h1>
                       <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Settings size={14} />
                          <span>Server: <span className="text-indigo-400 font-bold uppercase">{cleanServerName(serverList[activeServerIndex]?.server_name || '')}</span></span>
                       </div>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto">
                       {prevEp && <button onClick={() => navigate(`/xem-phim/${slug}/${prevEp.slug}?sv=${activeServerIndex}`)} className="flex-1 md:flex-none h-11 flex items-center justify-center gap-2 px-5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-black text-[10px] sm:text-sm uppercase"><ChevronLeft size={18} /> Tập trước</button>}
                       {nextEp && <button onClick={() => navigate(`/xem-phim/${slug}/${nextEp.slug}?sv=${activeServerIndex}`)} className="flex-1 md:flex-none h-11 flex items-center justify-center gap-2 px-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] sm:text-sm uppercase shadow-lg shadow-indigo-600/20 transition-all">Tập tiếp <ChevronRight size={18} /></button>}
                   </div>
               </div>

               {serverList.length > 1 && (
                   <div className="pt-4 mt-2 border-t border-slate-800/50">
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <Mic2 size={12} className="text-purple-400" />
                          <span>Lựa chọn Server & Ngôn ngữ:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {serverList.map((server, idx) => (
                              <button key={idx} onClick={() => setActiveServerIndex(idx)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeServerIndex === idx ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                  {cleanServerName(server.server_name)}
                              </button>
                          ))}
                      </div>
                   </div>
               )}
           </div>

           <div className="mt-6 p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                  <List size={20} className="text-indigo-500" />
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm">Danh sách tập phim</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-[280px] overflow-y-auto pr-2">
                  {currentServerData.map(ep => (
                      <Link key={ep.slug} to={`/xem-phim/${slug}/${ep.slug}?sv=${activeServerIndex}`} className={`py-2.5 rounded-xl text-center text-sm font-bold transition-all ${currentEpisode.slug === ep.slug ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'}`}>
                          {ep.name}
                      </Link>
                  ))}
              </div>
           </div>
        </div>
      </div>

      {recommendedMovies.length > 0 && (
        <section className="mt-16 mb-8 pt-12 border-t border-slate-900">
            <SectionTitle>Phim gợi ý</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {recommendedMovies.map(m => <MovieCard key={m._id} movie={m} />)}
            </div>
        </section>
      )}
    </div>
  );
};
