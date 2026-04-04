
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Movie } from '../types';
import { MovieCard, SectionTitle, Loader } from '../components/UI';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, SlidersHorizontal, SearchX, RotateCcw, Search, ChevronDown, Check, X } from 'lucide-react';

export const CategoryPage = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const pageParam = parseInt(searchParams.get('page') || '1');
  const genreParam = searchParams.get('genre') || '';
  const countryParam = searchParams.get('country') || '';
  const yearParam = searchParams.get('year') || '';
  const langParam = searchParams.get('lang') || '';
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter state as arrays for multi-select
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genreParam ? genreParam.split(',') : []);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(countryParam ? countryParam.split(',') : []);
  const [selectedYear, setSelectedYear] = useState(yearParam);
  const [selectedLang, setSelectedLang] = useState(langParam);

  const [genres, setGenres] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [years] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());
  });
  
  const audioOptions = [
    { name: 'Vietsub', slug: 'vietsub' },
    { name: 'Thuyết Minh', slug: 'thuyet-minh' },
    { name: 'Lồng Tiếng', slug: 'long-tieng' }
  ];

  const typeMap: Record<string, string> = {
      'phim-bo': 'Phim Bộ',
      'phim-le': 'Phim Lẻ',
      'hoat-hinh': 'Hoạt Hình',
      'tv-shows': 'TV Shows',
      'phim-moi': 'Khám Phá Phim Mới'
  };

  const shouldShowFilter = type !== 'phim-moi';

  useEffect(() => {
    const loadFilters = async () => {
        try {
            const [genresRes, countriesRes] = await Promise.all([
                api.getFilters('the-loai'),
                api.getFilters('quoc-gia')
            ]);
            setGenres(Array.isArray(genresRes) ? genresRes : (genresRes.data?.items || genresRes.items || []));
            setCountries(Array.isArray(countriesRes) ? countriesRes : (countriesRes.data?.items || countriesRes.items || []));
        } catch (err) {
            console.error("Error loading filters:", err);
        }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    
    const fetchMovies = async () => {
        try {
            const apiType = type === 'phim-moi' ? 'phim-bo' : type;
            const res = await api.getMoviesByType(
                apiType, 
                18, 
                pageParam, 
                genreParam, 
                countryParam, 
                yearParam,
                langParam
            );

            let baseTitle = typeMap[type] || 'Danh sách phim';
            if (genreParam) baseTitle += ` - Thể loại đa dạng`;
            if (countryParam) baseTitle += ` - Nhiều quốc gia`;
            if (yearParam) baseTitle += ` (${yearParam})`;
            
            setTitle(baseTitle);
            setMovies(res.data?.items || res.items || []);
            const pagination = res.data?.params?.pagination || res.pagination;
            if (pagination) {
              const tp = pagination.totalPages || (pagination.totalItems && pagination.totalItemsPerPage ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) : 1);
              setTotalPages(tp);
            }
        } catch (err) {
            console.error("Fetch movies error:", err);
            setMovies([]);
        } finally {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    fetchMovies();
  }, [type, pageParam, genreParam, countryParam, yearParam, langParam]);

  const toggleMultiSelect = (type: 'genre' | 'country', slug: string) => {
      if (type === 'genre') {
          setSelectedGenres(prev => 
              prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
          );
      } else {
          setSelectedCountries(prev => 
              prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
          );
      }
  };

  const applyFilters = () => {
      const newParams = new URLSearchParams();
      if (selectedGenres.length) newParams.set('genre', selectedGenres.join(','));
      if (selectedCountries.length) newParams.set('country', selectedCountries.join(','));
      if (selectedYear) newParams.set('year', selectedYear);
      if (selectedLang) newParams.set('lang', selectedLang);
      newParams.set('page', '1');
      setSearchParams(newParams);
      setIsFilterOpen(false);
  };

  const clearFilters = () => {
      setSelectedGenres([]);
      setSelectedCountries([]);
      setSelectedYear('');
      setSelectedLang('');
      setSearchParams({ page: '1' });
      setIsFilterOpen(false);
  };

  const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage.toString());
      setSearchParams(newParams);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const renderPageButton = (p: number) => (
      <button 
        key={p} 
        onClick={() => handlePageChange(p)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all border ${
          pageParam === p 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {p}
      </button>
    );

    const renderEllipsis = (key: string) => (
      <span key={key} className="text-slate-600 px-1 font-bold">...</span>
    );

    const getDesktopPages = () => {
      const pages = [];
      const delta = 2; // Pages to show around current
      
      pages.push(renderPageButton(1));
      
      if (pageParam > delta + 2) {
        pages.push(renderEllipsis('desktop-left'));
      }
      
      const start = Math.max(2, pageParam - delta);
      const end = Math.min(totalPages - 1, pageParam + delta);
      
      for (let i = start; i <= end; i++) {
        pages.push(renderPageButton(i));
      }
      
      if (pageParam < totalPages - (delta + 1)) {
        pages.push(renderEllipsis('desktop-right'));
      }
      
      if (totalPages > 1) {
        pages.push(renderPageButton(totalPages));
      }
      
      return pages;
    };

    const getMobilePages = () => {
      const pages = [];
      if (pageParam > 2) {
        pages.push(renderPageButton(1));
        if (pageParam > 3) pages.push(renderEllipsis('mobile-left'));
      }
      
      pages.push(renderPageButton(pageParam));
      
      if (pageParam < totalPages - 1) {
        if (pageParam < totalPages - 2) pages.push(renderEllipsis('mobile-right'));
        pages.push(renderPageButton(totalPages));
      }
      return pages;
    };

    return (
      <div className="mt-16 mb-16 flex flex-col items-center gap-4">
        {/* PC & Tablet Pagination */}
        <div className="hidden sm:flex items-center justify-center gap-2">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={pageParam === 1}
            title="Trang đầu"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20 hover:bg-slate-800 hover:text-white transition-all active:scale-90"
          >
            <ChevronsLeft size={18} />
          </button>
          <button 
            onClick={() => handlePageChange(pageParam - 1)}
            disabled={pageParam === 1}
            title="Trang trước"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20 hover:bg-slate-800 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>

          {getDesktopPages()}

          <button 
            onClick={() => handlePageChange(pageParam + 1)}
            disabled={pageParam === totalPages}
            title="Trang tiếp"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20 hover:bg-slate-800 hover:text-white transition-all active:scale-90"
          >
            <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={pageParam === totalPages}
            title="Trang cuối"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20 hover:bg-slate-800 hover:text-white transition-all active:scale-90"
          >
            <ChevronsRight size={18} />
          </button>
        </div>

        {/* Mobile Pagination */}
        <div className="flex sm:hidden items-center justify-center gap-1.5">
          <button 
            onClick={() => handlePageChange(pageParam - 1)}
            disabled={pageParam === 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20"
          >
            <ChevronLeft size={18} />
          </button>

          {getMobilePages()}

          <button 
            onClick={() => handlePageChange(pageParam + 1)}
            disabled={pageParam === totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 disabled:opacity-20"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] sm:hidden">
          Trang {pageParam} / {totalPages}
        </p>
      </div>
    );
  };

  const FilterPanelContent = () => (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                    <Filter size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Bộ lọc đa năng</h3>
                    <p className="text-[10px] text-slate-500 font-medium tracking-wide">Tìm kiếm phim theo sở thích của bạn</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={clearFilters} className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs transition-all border border-slate-800 flex items-center justify-center gap-2">
                    <RotateCcw size={16} /> Làm mới
                </button>
                <button onClick={applyFilters} className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95">
                    <Search size={16} /> Áp dụng
                </button>
            </div>
        </div>

        <div className="space-y-8">
            {/* Multi-select Genres */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Thể loại phim ({selectedGenres.length})</label>
                    {selectedGenres.length > 0 && (
                        <button onClick={() => setSelectedGenres([])} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Bỏ chọn</button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {genres.map(g => {
                        const isSelected = selectedGenres.includes(g.slug);
                        return (
                            <button 
                                key={g.slug} 
                                onClick={() => toggleMultiSelect('genre', g.slug)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                                    isSelected 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                }`}
                            >
                                {isSelected && <Check size={12} />}
                                {g.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Multi-select Countries */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Quốc gia ({selectedCountries.length})</label>
                        {selectedCountries.length > 0 && (
                            <button onClick={() => setSelectedCountries([])} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Bỏ chọn</button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {countries.map(c => {
                            const isSelected = selectedCountries.includes(c.slug);
                            return (
                                <button 
                                    key={c.slug} 
                                    onClick={() => toggleMultiSelect('country', c.slug)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                                        isSelected 
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                    }`}
                                >
                                    {isSelected && <Check size={12} />}
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Year & Audio selects */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Năm phát hành</label>
                        <div className="relative">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full bg-slate-900 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl outline-none border border-slate-800 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Tất cả</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Âm thanh</label>
                        <div className="relative">
                            <select 
                                value={selectedLang} 
                                onChange={(e) => setSelectedLang(e.target.value)}
                                className="w-full bg-slate-900 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl outline-none border border-slate-800 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Tất cả</option>
                                {audioOptions.map(l => <option key={l.slug} value={l.slug}>{l.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-[60vh] animate-in fade-in duration-700 relative">
      <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex-1">
              <SectionTitle>{title}</SectionTitle>
              <p className="text-slate-500 text-[11px] md:text-xs mt-[-1.2rem] ml-1 font-medium">
                {movies.length > 0 ? `Hiển thị trang ${pageParam} / ${totalPages}` : 'Đang tải dữ liệu...'}
              </p>
          </div>
          
          {shouldShowFilter && (
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 h-10 px-4 rounded-full border transition-all ${
                    isFilterOpen 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
            >
                {isFilterOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
                <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">Bộ lọc</span>
            </button>
          )}
      </div>

      {/* Desktop Filter Panel (Inline) */}
      {shouldShowFilter && isFilterOpen && (
        <div className="hidden md:block mb-10 p-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent rounded-[2rem] shadow-xl">
            <div className="bg-slate-950/90 backdrop-blur-3xl p-8 rounded-[1.9rem] border border-white/5 relative overflow-hidden">
                <FilterPanelContent />
            </div>
        </div>
      )}

      {/* Mobile Filter Overlay */}
      {shouldShowFilter && isFilterOpen && (
        <div className="md:hidden fixed inset-0 z-[120] flex flex-col animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsFilterOpen(false)}></div>
            <div className="relative mt-auto bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8"></div>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Bộ lọc phim</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <FilterPanelContent />
            </div>
        </div>
      )}
      
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-14 h-14 border-4 border-indigo-500/10 border-t-indigo-500 animate-spin rounded-full mb-6 shadow-xl"></div>
            <p className="text-slate-500 font-black tracking-widest text-xs uppercase animate-pulse">Đang kết nối kho phim...</p>
        </div>
      ) : (
          <>
            {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 px-1">
                    {movies.map(movie => <MovieCard key={movie._id} movie={movie} />)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-900/10 rounded-[3rem] border border-dashed border-slate-800 text-center">
                    <SearchX size={56} className="text-slate-800 mb-6" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Không có kết quả phù hợp</h3>
                    <p className="text-slate-500 mt-2 max-w-sm font-medium">Bạn có thể thử chọn ít điều kiện hơn hoặc nhấn "Làm mới" bộ lọc.</p>
                    <button onClick={clearFilters} className="mt-10 px-12 py-4 bg-white text-slate-950 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl">
                        XEM LẠI DANH SÁCH GỐC
                    </button>
                </div>
            )}
            {totalPages > 1 && movies.length > 0 && renderPagination()}
          </>
      )}
    </div>
  );
};
