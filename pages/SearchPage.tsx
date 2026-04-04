
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Movie } from '../types';
import { MovieCard, SectionTitle, Loader } from '../components/UI';
import { SearchX, Filter, Check, X } from 'lucide-react';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('k') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Reset filters whenever keyword changes to avoid previous filters hiding new results (e.g. clicking an actor)
  useEffect(() => {
    setFilterType('all');
    setFilterYear('all');
  }, [keyword]);

  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    setMovies([]); // Clear old results while searching for new ones
    api.searchMoviesCombined(keyword)
      .then(items => {
          setMovies(items);
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  // Derived filter options
  const years = useMemo(() => {
    // Explicitly cast to string[] to ensure localeCompare is available on elements
    const y = Array.from(new Set(movies.map(m => m.year?.toString()).filter(Boolean))) as string[];
    return y.sort((a, b) => b.localeCompare(a));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
        const matchesYear = filterYear === 'all' || m.year?.toString() === filterYear;
        // Simple heuristic for type if backend doesn't provide it clearly in search
        // Movies usually have specific keywords or properties
        const isSeries = m.name.toLowerCase().includes('tập') || m.origin_name.toLowerCase().includes('tv series');
        const matchesType = filterType === 'all' || 
                           (filterType === 'series' && isSeries) || 
                           (filterType === 'movie' && !isSeries);
        
        return matchesYear && matchesType;
    });
  }, [movies, filterType, filterYear]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-[60vh] animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <SectionTitle>Tìm kiếm: "{keyword}"</SectionTitle>
          {movies.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                      <button 
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >Tất cả</button>
                      <button 
                        onClick={() => setFilterType('movie')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${filterType === 'movie' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >Phim Lẻ</button>
                      <button 
                        onClick={() => setFilterType('series')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${filterType === 'series' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >Phim Bộ</button>
                  </div>

                  <div className="relative">
                      <select 
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 px-4 pr-8 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                      >
                          <option value="all">Mọi năm</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
              </div>
          )}
      </div>
      
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredMovies.map(movie => <MovieCard key={movie._id} movie={movie} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/10 rounded-[3rem] border border-dashed border-slate-800">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
              <SearchX size={40} className="text-slate-700" />
          </div>
          <p className="text-xl font-bold text-white mb-2">Không có kết quả phù hợp</p>
          <p className="text-sm max-w-xs text-center mb-8">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
          {(filterType !== 'all' || filterYear !== 'all') && (
              <button 
                onClick={() => { setFilterType('all'); setFilterYear('all'); }}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition-all shadow-xl"
              >
                  <X size={18} /> Xóa bộ lọc
              </button>
          )}
        </div>
      )}
    </div>
  );
};
