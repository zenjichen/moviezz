
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Movie } from '../types';
import { storage } from '../utils/storage';
import { MovieCard, SectionTitle, Loader } from '../components/UI';
import { HeartOff } from 'lucide-react';

export const FavoritesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const slugs = storage.getFavorites();
    if (slugs.length === 0) {
        setLoading(false);
        return;
    }

    // Since we only have slugs, we must fetch details for each.
    // In a real optimized app, we would cache this data or backend handles it.
    // For this client-side demo, we fetch in parallel.
    Promise.all(slugs.map(slug => api.getMovieDetail(slug)))
      .then(results => {
          const validMovies = results
            .filter(r => r.status)
            .map(r => r.movie);
          setMovies(validMovies);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-[60vh] animate-in fade-in duration-500">
      <SectionTitle>Phim Yêu Thích</SectionTitle>
      
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {movies.map(movie => <MovieCard key={movie._id} movie={movie} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <HeartOff size={48} className="mb-4" />
          <p>Bạn chưa có phim yêu thích nào.</p>
        </div>
      )}
    </div>
  );
};
