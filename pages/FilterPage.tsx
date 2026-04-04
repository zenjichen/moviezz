
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Movie } from '../types';
import { MovieCard, Loader } from '../components/UI';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag, Globe } from 'lucide-react';

export const FilterPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const filterType = location.pathname.startsWith('/the-loai') ? 'the-loai' : 'quoc-gia';
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!filterType || !slug) return;
    setLoading(true);

    const ft = filterType as 'the-loai' | 'quoc-gia';

    const fetchData = async () => {
      try {
        // Get filter name
        const filters = await api.getFilters(ft);
        const filterList = Array.isArray(filters) ? filters : (filters.data?.items || filters.items || []);
        const found = filterList.find((f: any) => f.slug === slug);
        const filterName = found?.name || slug;
        
        setTitle(ft === 'the-loai' ? `Thể loại: ${filterName}` : `Quốc gia: ${filterName}`);

        // Get movies
        const res = await api.getMoviesByFilter(ft, slug, page, 24);
        setMovies(res.data?.items || res.items || []);
        const pagination = res.data?.params?.pagination || res.pagination;
        if (pagination) {
          const tp = pagination.totalPages || (pagination.totalItems && pagination.totalItemsPerPage ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) : 1);
          setTotalPages(tp);
        }
      } catch (err) {
        console.error('Filter page error:', err);
        setMovies([]);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchData();
  }, [filterType, slug, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setSearchParams({ page: p.toString() });
  };

  const isGenre = filterType === 'the-loai';
  const IconComp = isGenre ? Tag : Globe;
  const accentColor = isGenre ? 'indigo' : 'purple';

  return (
    <div className="min-h-[60vh] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-12 h-12 bg-${accentColor}-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-${accentColor}-600/20`}>
          <IconComp size={24} />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{title}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {movies.map(movie => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button onClick={() => goToPage(1)} disabled={page <= 1} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                <ChevronsLeft size={16} />
              </button>
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              
              {(() => {
                const pages = [];
                const start = Math.max(1, page - 2);
                const end = Math.min(totalPages, page + 2);
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button key={i} onClick={() => goToPage(i)} className={`w-10 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${i === page ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500'}`}>
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => goToPage(totalPages)} disabled={page >= totalPages} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                <ChevronsRight size={16} />
              </button>
              
              <span className="text-slate-600 text-xs font-bold ml-2">{page}/{totalPages}</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <IconComp size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Không tìm thấy phim nào</p>
        </div>
      )}
    </div>
  );
};
