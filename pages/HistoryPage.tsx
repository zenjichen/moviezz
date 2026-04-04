
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import { WatchHistoryItem } from '../types';
import { SectionTitle, Loader } from '../components/UI';
import { getImageUrl } from '../services/api';
import { Play, Trash2, Clock, AlertCircle } from 'lucide-react';

export const HistoryPage = () => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadHistory();
  }, []);

  const loadHistory = () => {
    const h = storage.getHistory();
    // Sort by lastUpdated desc
    const sorted = Object.values(h).sort((a, b) => b.lastUpdated - a.lastUpdated);
    setHistory(sorted);
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min}p ${sec}s`;
  }

  const handleDeleteItem = (slug: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("Bạn muốn xóa phim này khỏi lịch sử?")) {
          storage.removeHistoryItem(slug);
          loadHistory();
      }
  };

  const handleClearAll = () => {
      if (window.confirm("Bạn muốn xóa toàn bộ lịch sử xem phim?")) {
          storage.clearAllHistory();
          loadHistory();
      }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-[60vh] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionTitle>Lịch Sử Xem</SectionTitle>
          {history.length > 0 && (
              <button 
                  onClick={handleClearAll}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all text-sm font-bold shadow-lg shadow-red-500/5"
              >
                  <Trash2 size={16} /> Xóa tất cả
              </button>
          )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
            <p className="text-slate-500 text-xs px-1 mb-2">Lưu tối đa 60 phim gần nhất. Phim cũ hơn sẽ tự động được xóa.</p>
            {history.map(item => (
                <div key={item.slug} className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-4 transition-all hover:bg-slate-800/80 hover:border-indigo-500/30 backdrop-blur-sm">
                    <Link to={`/xem-phim/${item.slug}/${item.episodeSlug}`} className="flex-shrink-0 w-24 sm:w-32 aspect-[2/3] rounded-lg overflow-hidden relative border border-white/5">
                         <img src={getImageUrl(item.poster_url)} alt={item.name} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Play size={24} className="text-white fill-white" />
                         </div>
                    </Link>
                    
                    <div className="flex-1 flex flex-col justify-center pr-10">
                        <Link to={`/phim/${item.slug}`} className="text-lg font-bold text-white hover:text-indigo-400 mb-1 leading-tight line-clamp-1">{item.name}</Link>
                        <p className="text-slate-400 text-sm mb-3">Đang xem: <span className="text-indigo-400 font-bold">{item.episodeName}</span></p>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
                                <Clock size={12} className="text-indigo-400" /> {formatTime(item.timestamp)}
                            </span>
                            <span className="opacity-70">{new Date(item.lastUpdated).toLocaleDateString('vi-VN')} {new Date(item.lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button 
                            onClick={(e) => handleDeleteItem(item.slug, e)}
                            className="p-2.5 rounded-full bg-slate-950/50 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all shadow-sm"
                            title="Xóa khỏi lịch sử"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <Link 
                        to={`/xem-phim/${item.slug}/${item.episodeSlug}`}
                        className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2 px-4 rounded-full shadow-lg shadow-indigo-600/20 transition-all hidden sm:block"
                    >
                        Tiếp tục xem
                    </Link>
                </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Lịch sử xem trống</p>
            <p className="text-sm opacity-60">Những bộ phim bạn đã xem sẽ xuất hiện tại đây.</p>
            <Link to="/" className="mt-6 px-6 py-2 bg-slate-800 hover:bg-indigo-600 text-white rounded-full transition-all text-sm font-bold">
                Khám phá ngay
            </Link>
        </div>
      )}
    </div>
  );
};
