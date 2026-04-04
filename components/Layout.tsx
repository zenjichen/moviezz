
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Heart, Clock, Film, Tv, Star, Clapperboard, User, Phone, Play, Filter, Loader2, Zap, Library, ChevronRight, Sparkles, LayoutGrid, ChevronUp, Mail, Send, ShieldCheck, FileText, Info as InfoIcon, ChevronDown, Globe, Tag, Download, Settings, Monitor, Smartphone, Apple, Laptop, TvMinimal, ExternalLink, Check, Pencil } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Movie } from '../types';
import { storage } from '../utils/storage';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Badge counts
  const [favCount, setFavCount] = useState(0);
  const [histCount, setHistCount] = useState(0);

  // Dropdown data
  const [genres, setGenres] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<'genre' | 'country' | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch genres and countries for dropdown
  useEffect(() => {
    api.getFilters('the-loai').then(res => {
      setGenres(Array.isArray(res) ? res : (res.data?.items || res.items || []));
    }).catch(() => { });
    api.getFilters('quoc-gia').then(res => {
      setCountries(Array.isArray(res) ? res : (res.data?.items || res.items || []));
    }).catch(() => { });
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSuggestions(false);
    setActiveDropdown(null);

    // Update badge counts on location change
    setFavCount(storage.getFavorites().length);
    setHistCount(Object.keys(storage.getHistory()).length);
  }, [location]);

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.searchMovies(query, 6);
      const items = res.data?.items || res.items || [];
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    } catch (err) {
      console.error("Search error:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
      navigate(`/tim-kiem?k=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const closeSearchMenus = () => {
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setSearchQuery('');
  };

  // Improved navigation for suggestions to prevent focus issues
  const navigateTo = (path: string) => {
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const navLinks = [
    { name: 'Phim Bộ', path: '/danh-sach/phim-bo', icon: Tv, color: 'text-blue-400' },
    { name: 'Phim Lẻ', path: '/danh-sach/phim-le', icon: Film, color: 'text-indigo-400' },
    { name: 'Hoạt Hình', path: '/danh-sach/hoat-hinh', icon: Library, color: 'text-emerald-400' },
    { name: 'Phim Mới', path: '/danh-sach/phim-moi', icon: Sparkles, color: 'text-yellow-400' },
  ];

  const personalLinks = [
    { name: 'Yêu Thích', path: '/yeu-thich', icon: Heart, bg: 'bg-rose-500/10 border-rose-500/30', activeBg: 'bg-rose-600', textColor: 'text-rose-400', count: favCount },
    { name: 'Lịch Sử', path: '/lich-su', icon: Clock, bg: 'bg-amber-500/10 border-amber-500/30', activeBg: 'bg-amber-600', textColor: 'text-amber-400', count: histCount },
  ];

  const headerBgClass = isMobileMenuOpen
    ? 'bg-slate-950'
    : (isScrolled ? 'bg-slate-950/95 shadow-2xl border-b border-white/5 backdrop-blur-xl' : 'bg-gradient-to-b from-slate-950/90 to-transparent');

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${headerBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-3 group z-50" onClick={closeSearchMenus}>
          <div className="p-1.5 bg-indigo-600 rounded-lg group-hover:rotate-6 transition-transform">
            <Clapperboard size={24} className="text-white" />
          </div>
          <span className="font-black italic tracking-[-0.075em] text-2xl uppercase text-white">
            HÀ<span className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">MOVIE</span><span className="text-slate-300 text-lg ml-1">HOUSE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0" ref={dropdownRef}>
          <nav className="flex items-center gap-0.5 bg-slate-900/40 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {[...navLinks, ...personalLinks].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`h-9 px-3 lg:px-4 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${location.pathname === link.path
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                <span>{link.name}</span>
                {'count' in link && link.count > 0 && (
                  <span className={`px-1.5 py-0.5 min-w-[1.25rem] text-center rounded-full text-[10px] font-black ${location.pathname === link.path ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}>
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Genre Dropdown Button */}
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'genre' ? null : 'genre')}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-full text-[13px] font-bold transition-all border backdrop-blur-md whitespace-nowrap ${activeDropdown === 'genre'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900/40 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
          >
            <Tag size={13} />
            <span className="hidden lg:inline">Thể Loại</span>
            <ChevronDown size={11} className={`transition-transform ${activeDropdown === 'genre' ? 'rotate-180' : ''}`} />
          </button>

          {/* Country Dropdown Button */}
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'country' ? null : 'country')}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-full text-[13px] font-bold transition-all border backdrop-blur-md whitespace-nowrap ${activeDropdown === 'country'
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                : 'bg-slate-900/40 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
          >
            <Globe size={13} />
            <span className="hidden lg:inline">Quốc Gia</span>
            <ChevronDown size={11} className={`transition-transform ${activeDropdown === 'country' ? 'rotate-180' : ''}`} />
          </button>

          {/* Genre Dropdown Panel */}
          {activeDropdown === 'genre' && genres.length > 0 && (
            <div className="absolute top-full mt-3 left-0 right-0 mx-auto max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-[110]">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={16} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Thể loại phim</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <Link
                    key={g.slug}
                    to={`/the-loai/${g.slug}`}
                    onClick={() => setActiveDropdown(null)}
                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all border border-slate-700/50 hover:border-indigo-500"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Country Dropdown Panel */}
          {activeDropdown === 'country' && countries.length > 0 && (
            <div className="absolute top-full mt-3 left-0 right-0 mx-auto max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-[110]">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Quốc gia</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {countries.map(c => (
                  <Link
                    key={c.slug}
                    to={`/quoc-gia/${c.slug}`}
                    onClick={() => setActiveDropdown(null)}
                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-purple-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all border border-slate-700/50 hover:border-purple-500"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 relative" ref={searchRef}>
          <DownloadPanel />
          <ServerHealthMonitor />
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative group mb-0">
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              className="h-10 bg-black/40 border border-slate-700/50 text-slate-100 text-sm rounded-full pl-10 pr-4 w-44 lg:w-56 focus:w-72 focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-500 backdrop-blur-md mb-0"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery.length >= 2 && fetchSuggestions(searchQuery)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              {isSearching ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div> : <Search size={16} className="text-slate-500" />}
            </div>

            {showSuggestions && (
              <div className="absolute top-full mt-3 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-w-[320px] animate-in fade-in slide-in-from-top-2 z-[110]">
                <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gợi ý kết quả</span>
                  <button
                    onMouseDown={() => navigateTo(`/tim-kiem?k=${encodeURIComponent(searchQuery.trim())}`)}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Xem tất cả
                  </button>
                </div>
                {suggestions.map((movie) => (
                  <button
                    key={movie._id}
                    onMouseDown={() => navigateTo(`/phim/${movie.slug}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-indigo-600/10 group transition-all border-b border-slate-800/30 last:border-0 text-left"
                  >
                    <img src={getImageUrl(movie.thumb_url)} alt={movie.name} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-indigo-400 truncate">{movie.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{movie.year}</p>
                    </div>
                    <Play size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100" fill="currentColor" />
                  </button>
                ))}
              </div>
            )}
          </form>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden flex items-center justify-center transition-all p-2 ${isMobileMenuOpen ? 'text-indigo-500 scale-110' : 'text-slate-300 hover:text-white'}`}
          >
            {isMobileMenuOpen ? <X size={26} /> : <LayoutGrid size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-x-0 top-16 bottom-0 bg-slate-950 z-[90] md:hidden overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 flex flex-col gap-8 pb-12">
              {/* Search Section */}
              <div className="relative">
                <form onSubmit={handleSearch} className="relative group mb-0">
                  <input
                    type="text"
                    placeholder="Nhập tên phim bạn muốn tìm..."
                    className="relative w-full h-14 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-500 mb-0"
                    value={searchQuery}
                    onChange={handleInputChange}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {isSearching ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div> : <Search size={20} />}
                  </div>
                </form>

                {/* Mobile Search Suggestions */}
                {showSuggestions && searchQuery.length >= 2 && (
                  <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gợi ý kết quả</span>
                      <button
                        onMouseDown={() => navigateTo(`/tim-kiem?k=${encodeURIComponent(searchQuery.trim())}`)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    {suggestions.map(movie => (
                      <button
                        key={movie._id}
                        onMouseDown={() => navigateTo(`/phim/${movie.slug}`)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-slate-800 border-b border-slate-800/50 last:border-0 text-left"
                      >
                        <img src={getImageUrl(movie.thumb_url)} className="w-12 h-16 object-cover rounded-lg shadow-md" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{movie.name}</p>
                          <p className="text-xs text-slate-500">{movie.year}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Khám phá</h3>
                <div className="grid grid-cols-2 gap-3">
                  {navLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border transition-all duration-300 ${location.pathname === link.path
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                      <div className={`p-3 rounded-2xl ${location.pathname === link.path ? 'bg-white/20' : 'bg-slate-800'}`}>
                        <link.icon size={24} className={location.pathname === link.path ? 'text-white' : link.color} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Genre Section - Mobile */}
              {genres.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Tag size={12} className="text-indigo-400" /> Thể loại phim</h3>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(g => (
                      <Link key={g.slug} to={`/the-loai/${g.slug}`} className="px-3 py-2 bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-xs font-bold rounded-xl transition-all">
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Section - Mobile */}
              {countries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Globe size={12} className="text-purple-400" /> Quốc gia</h3>
                  <div className="flex flex-wrap gap-2">
                    {countries.slice(0, 20).map(c => (
                      <Link key={c.slug} to={`/quoc-gia/${c.slug}`} className="px-3 py-2 bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-purple-600 hover:text-white hover:border-purple-500 text-xs font-bold rounded-xl transition-all">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Cá nhân</h3>
                <div className="grid grid-cols-2 gap-3">
                  {personalLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border transition-all duration-300 ${location.pathname === link.path
                          ? `${link.activeBg} border-transparent text-white shadow-xl`
                          : `${link.bg} text-slate-300 hover:brightness-125`
                        }`}
                    >
                      <div className="relative">
                        <div className={`p-3 rounded-2xl ${location.pathname === link.path ? 'bg-white/20' : 'bg-slate-900/50'}`}>
                          <link.icon size={24} className={location.pathname === link.path ? 'text-white' : link.textColor} />
                        </div>
                        {link.count > 0 && (
                          <span className={`absolute -top-1.5 -right-1.5 min-w-[1.5rem] h-6 flex items-center justify-center rounded-full text-[10px] font-black border-2 ${location.pathname === link.path
                              ? 'bg-white text-slate-900 border-indigo-600'
                              : 'bg-indigo-600 text-white border-slate-900'
                            } shadow-lg`}>
                            {link.count}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

// === SERVER HEALTH MONITOR ===
const SERVER_PASS = '1';

interface ServerStatus {
  name: string;
  url: string;
  ping: string;
  status: 'checking' | 'online' | 'offline';
  responseTime: number;
}

export const ServerHealthMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [servers, setServers] = useState<ServerStatus[]>([
    { name: 'OPhim (Primary)', url: 'https://ophim1.com/v1/api/danh-sach/phim-moi-cap-nhat?page=1', ping: 'ophim1.com', status: 'checking', responseTime: 0 },
    { name: 'PhimAPI (Fallback)', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1', ping: 'phimapi.com', status: 'checking', responseTime: 0 },
    { name: 'NguonC', url: 'https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1', ping: 'phim.nguonc.com', status: 'checking', responseTime: 0 },
  ]);

  const checkServers = async () => {
    const updated = await Promise.all(
      servers.map(async (server) => {
        const start = Date.now();
        try {
          const res = await fetch(server.url, { signal: AbortSignal.timeout(8000) });
          const time = Date.now() - start;
          return { ...server, status: res.ok ? 'online' as const : 'offline' as const, responseTime: time };
        } catch {
          return { ...server, status: 'offline' as const, responseTime: Date.now() - start };
        }
      })
    );
    setServers(updated);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === SERVER_PASS) {
      setIsAuthed(true);
      setPassError(false);
      checkServers();
    } else {
      setPassError(true);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && isAuthed) checkServers();
  };

  const getStatusColor = (s: ServerStatus) => {
    if (s.status === 'checking') return 'bg-yellow-500';
    if (s.status === 'online') return s.responseTime < 1500 ? 'bg-emerald-500' : 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = (s: ServerStatus) => {
    if (s.status === 'checking') return 'Đang kiểm tra...';
    if (s.status === 'online') return `${s.responseTime}ms`;
    return 'Không phản hồi';
  };

  const overallHealth = servers.every(s => s.status === 'online') ? 'emerald' : servers.some(s => s.status === 'online') ? 'amber' : 'red';

  return (
    <div className="relative">
      {/* Inline Button */}
      <button
        onClick={handleOpen}
        className="w-9 h-9 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all group active:scale-90 relative"
        title="Server Health"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></svg>
        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isAuthed ? (overallHealth === 'emerald' ? 'bg-emerald-500' : overallHealth === 'amber' ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-600'} ${isAuthed && servers.some(s => s.status === 'checking') ? 'animate-pulse' : ''}`}></span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 z-[200] w-80 bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></svg>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Server Monitor</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {!isAuthed ? (
            <form onSubmit={handleAuth} className="p-5 space-y-4">
              <p className="text-slate-400 text-xs text-center">🔒 Nhập mật khẩu để xem trạng thái server</p>
              <input
                type="password"
                value={passInput}
                onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
                placeholder="Mật khẩu..."
                className={`w-full h-10 bg-slate-900 border ${passError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-slate-800'} text-white text-sm rounded-xl px-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600`}
                autoFocus
              />
              {passError && <p className="text-red-400 text-[10px] font-bold text-center">Sai mật khẩu!</p>}
              <button type="submit" className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                Xác nhận
              </button>
            </form>
          ) : (
            <div className="p-4 space-y-3">
              {servers.map((server, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(server)} ${server.status === 'checking' ? 'animate-pulse' : ''}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{server.name}</p>
                    <p className="text-slate-500 text-[10px] font-mono">{server.ping}</p>
                  </div>
                  <span className={`text-[11px] font-bold ${server.status === 'online' ? (server.responseTime < 1500 ? 'text-emerald-400' : 'text-amber-400') : server.status === 'offline' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {getStatusText(server)}
                  </span>
                </div>
              ))}
              <button
                onClick={checkServers}
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                Kiểm tra lại
              </button>
              <p className="text-slate-600 text-[9px] text-center">Tự động ping khi mở panel</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// === DOWNLOAD PANEL ===
const DOWNLOAD_PASS = '1';

interface DownloadLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string;
}

interface DownloadSettings {
  links: DownloadLinkItem[];
  hiddenPlatforms: string[];      // platforms hidden from users
  hiddenLinks: string[];           // individual link ids hidden
  platformDescriptions: Record<string, string>;
  platformLabels: Record<string, string>;  // custom platform display names
  footerTip: string;
  windowsDescription: string;
}

const DEFAULT_DOWNLOADS: DownloadLinkItem[] = [
  { id: 'win', platform: 'Windows', label: 'Tải .zip', url: '#', icon: 'monitor' },
  { id: 'android-phone', platform: 'Android', label: 'Điện Thoại', url: '#', icon: 'smartphone' },
  { id: 'android-tv', platform: 'Android', label: 'Android TV', url: '#', icon: 'tv' },
  { id: 'ios-testflight', platform: 'iOS', label: 'Tải qua TestFlight', url: '#', icon: 'apple' },
  { id: 'ios-activate', platform: 'iOS', label: 'Lấy Mã Kích Hoạt', url: '#', icon: 'apple' },
  { id: 'ios-ipa', platform: 'iOS', label: 'Tải IPA', url: '#', icon: 'apple' },
  { id: 'macos', platform: 'macOS', label: 'Tải zip', url: '#', icon: 'laptop' },
  { id: 'linux', platform: 'Linux', label: 'Tải .zip', url: '#', icon: 'monitor' },
  { id: 'smarttv', platform: 'Smart TV Khác', label: 'Tham gia nhóm', url: '#', icon: 'tv' },
];

const DEFAULT_PLATFORM_DESCRIPTIONS: Record<string, string> = {
  'Android': 'Tải APK và cài đặt trực tiếp.',
  'iOS': 'Cài qua Testflight hoặc dùng các cách sideload IPA...',
  'macOS': 'Ứng dụng cho Mac, hỗ trợ Apple Silicon.',
  'Linux': 'Hỗ trợ các bản phân phối phổ biến (Ubuntu, Fedora...).',
  'Smart TV Khác': 'Hỗ trợ Apple TV, LG TV và Samsung TV.',
};

const DEFAULT_FOOTER_TIP = 'Đối với ứng dụng cài qua Testflight khi mở lên lần đầu yêu cầu có mã kích hoạt, hãy bấm vào Lấy Mã Kích Hoạt sau đó điền vào ứng dụng.';
const DEFAULT_WIN_DESC = 'File .zip giải nén ra để chạy.';

const getSettings = (): DownloadSettings => {
  try {
    const saved = localStorage.getItem('hm_dl_settings');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<DownloadSettings>;
      const links = DEFAULT_DOWNLOADS.map(d => {
        const found = parsed.links?.find(p => p.id === d.id);
        return found ? { ...d, url: found.url, label: found.label || d.label } : d;
      });
      return {
        links,
        hiddenPlatforms: parsed.hiddenPlatforms || [],
        hiddenLinks: parsed.hiddenLinks || [],
        platformDescriptions: { ...DEFAULT_PLATFORM_DESCRIPTIONS, ...(parsed.platformDescriptions || {}) },
        platformLabels: parsed.platformLabels || {},
        footerTip: parsed.footerTip ?? DEFAULT_FOOTER_TIP,
        windowsDescription: parsed.windowsDescription ?? DEFAULT_WIN_DESC,
      };
    }
  } catch { }
  return {
    links: DEFAULT_DOWNLOADS,
    hiddenPlatforms: [],
    hiddenLinks: [],
    platformDescriptions: { ...DEFAULT_PLATFORM_DESCRIPTIONS },
    platformLabels: {},
    footerTip: DEFAULT_FOOTER_TIP,
    windowsDescription: DEFAULT_WIN_DESC,
  };
};

const saveSettings = (settings: DownloadSettings) => {
  localStorage.setItem('hm_dl_settings', JSON.stringify(settings));
};

const PlatformIcon = ({ type, size = 18, className = '' }: { type: string; size?: number; className?: string }) => {
  switch (type) {
    case 'monitor': return <Monitor size={size} className={className} />;
    case 'smartphone': return <Smartphone size={size} className={className} />;
    case 'apple': return <Apple size={size} className={className} />;
    case 'laptop': return <Laptop size={size} className={className} />;
    case 'tv': return <TvMinimal size={size} className={className} />;
    default: return <Download size={size} className={className} />;
  }
};

type AdminView = 'none' | 'edit-links' | 'settings';

export const DownloadPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>('none');
  const [settings, setSettings] = useState<DownloadSettings>(getSettings);
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [editLabels, setEditLabels] = useState<Record<string, string>>({});
  const [editDescriptions, setEditDescriptions] = useState<Record<string, string>>({});
  const [editPlatformLabels, setEditPlatformLabels] = useState<Record<string, string>>({});
  const [editFooterTip, setEditFooterTip] = useState('');
  const [editWinDesc, setEditWinDesc] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === DOWNLOAD_PASS) {
      setIsAdmin(true);
      setPassError(false);
      setShowPassPrompt(false);
    } else {
      setPassError(true);
    }
  };

  const startEditLinks = () => {
    const urls: Record<string, string> = {};
    const labels: Record<string, string> = {};
    settings.links.forEach(d => { urls[d.id] = d.url; labels[d.id] = d.label; });
    setEditUrls(urls);
    setEditLabels(labels);
    setEditWinDesc(settings.windowsDescription);
    setAdminView('edit-links');
  };

  const saveEditLinks = () => {
    const updated = settings.links.map(d => ({ ...d, url: editUrls[d.id] || d.url, label: editLabels[d.id] || d.label }));
    const newSettings = { ...settings, links: updated, windowsDescription: editWinDesc };
    setSettings(newSettings);
    saveSettings(newSettings);
    setAdminView('none');
  };

  const openSettings = () => {
    setEditDescriptions({ ...settings.platformDescriptions });
    setEditPlatformLabels({ ...settings.platformLabels });
    setEditFooterTip(settings.footerTip);
    setAdminView('settings');
  };

  const saveSettingsPanel = () => {
    const newSettings = {
      ...settings,
      platformDescriptions: editDescriptions,
      platformLabels: editPlatformLabels,
      footerTip: editFooterTip,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    setAdminView('none');
  };

  const togglePlatformVisibility = (platform: string) => {
    const hidden = [...settings.hiddenPlatforms];
    const idx = hidden.indexOf(platform);
    if (idx >= 0) hidden.splice(idx, 1);
    else hidden.push(platform);
    const newSettings = { ...settings, hiddenPlatforms: hidden };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const toggleLinkVisibility = (linkId: string) => {
    const hidden = [...settings.hiddenLinks];
    const idx = hidden.indexOf(linkId);
    if (idx >= 0) hidden.splice(idx, 1);
    else hidden.push(linkId);
    const newSettings = { ...settings, hiddenLinks: hidden };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const winLink = settings.links.find(d => d.id === 'win')!;
  const isWinHidden = settings.hiddenLinks.includes('win');
  const otherLinks = settings.links.filter(d => d.id !== 'win');

  // Group other links by platform
  const allPlatforms = Array.from(new Set<string>(otherLinks.map(l => l.platform)));
  const platformGroups: Record<string, DownloadLinkItem[]> = {};
  otherLinks.forEach(link => {
    if (!platformGroups[link.platform]) platformGroups[link.platform] = [];
    platformGroups[link.platform].push(link);
  });

  const platformColors: Record<string, string> = {
    'Android': 'border-emerald-500/30',
    'iOS': 'border-blue-500/30',
    'macOS': 'border-slate-400/30',
    'Linux': 'border-orange-500/30',
    'Smart TV Khác': 'border-purple-500/30',
  };

  // For display: filter hidden platforms (unless admin)
  const visiblePlatformEntries = Object.entries(platformGroups).filter(([platform]) =>
    isAdmin || !settings.hiddenPlatforms.includes(platform)
  );

  return (
    <div className="relative" ref={panelRef}>
      {/* Download Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 backdrop-blur-md border rounded-xl flex items-center justify-center transition-all group active:scale-90 relative ${
          isOpen
            ? 'bg-red-600/80 border-red-500/50 text-white shadow-lg shadow-red-600/20'
            : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-red-500/50'
        }`}
        title="Tải ứng dụng"
      >
        <Download size={16} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 z-[200] w-[360px] max-h-[80vh] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-300 no-scrollbar">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-2xl z-10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <Clapperboard size={14} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {adminView === 'settings' ? 'Cài đặt' : adminView === 'edit-links' ? 'Sửa link' : 'Tải Hà Movie'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {isAdmin && adminView === 'none' && (
                <>
                  <button
                    onClick={startEditLinks}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    title="Chỉnh sửa link"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={openSettings}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    title="Cài đặt hiển thị"
                  >
                    <Settings size={13} />
                  </button>
                </>
              )}
              {isAdmin && adminView === 'edit-links' && (
                <button
                  onClick={saveEditLinks}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="Lưu thay đổi"
                >
                  <Check size={13} />
                </button>
              )}
              {isAdmin && adminView === 'settings' && (
                <button
                  onClick={saveSettingsPanel}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="Lưu cài đặt"
                >
                  <Check size={13} />
                </button>
              )}
              {isAdmin && adminView !== 'none' && (
                <button
                  onClick={() => setAdminView('none')}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                  title="Quay lại"
                >
                  <ChevronDown size={13} className="rotate-90" />
                </button>
              )}
              {!isAdmin && (
                <button
                  onClick={() => setShowPassPrompt(!showPassPrompt)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Admin"
                >
                  <Settings size={13} />
                </button>
              )}
              <button onClick={() => { setIsOpen(false); setAdminView('none'); }} className="text-slate-500 hover:text-white transition-colors ml-1">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Admin Password Prompt */}
          {showPassPrompt && !isAdmin && (
            <form onSubmit={handleAuth} className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-900/50">
              <p className="text-slate-400 text-xs text-center">🔒 Nhập mật khẩu admin để quản lý</p>
              <input
                type="password"
                value={passInput}
                onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
                placeholder="Mật khẩu..."
                className={`w-full h-9 bg-slate-900 border ${passError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-slate-800'} text-white text-sm rounded-xl px-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600`}
                autoFocus
              />
              {passError && <p className="text-red-400 text-[10px] font-bold text-center">Sai mật khẩu!</p>}
              <button type="submit" className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
                Xác nhận
              </button>
            </form>
          )}

          {/* === ADMIN: SETTINGS VIEW === */}
          {adminView === 'settings' && (
            <div className="p-4 space-y-5">
              {/* Platform Visibility Toggles */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hiển thị nền tảng</h4>
                
                {/* Windows toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon type="monitor" size={14} className="text-red-400" />
                    <span className="text-white text-xs font-bold">Windows</span>
                    <span className="text-slate-600 text-[10px]">(Chính)</span>
                  </div>
                  <button
                    onClick={() => toggleLinkVisibility('win')}
                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${isWinHidden ? 'bg-slate-700' : 'bg-emerald-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isWinHidden ? 'left-0.5' : 'left-[1.375rem]'}`}></div>
                  </button>
                </div>

                {/* Other platform toggles */}
                {allPlatforms.map(platform => {
                  const isHidden = settings.hiddenPlatforms.includes(platform);
                  return (
                    <div key={platform} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon type={platformGroups[platform]?.[0]?.icon || 'monitor'} size={14} className="text-red-400" />
                        <span className="text-white text-xs font-bold">{settings.platformLabels[platform] || platform}</span>
                        {isHidden && <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-bold">ẨN</span>}
                      </div>
                      <button
                        onClick={() => togglePlatformVisibility(platform)}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${isHidden ? 'bg-slate-700' : 'bg-emerald-600'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isHidden ? 'left-0.5' : 'left-[1.375rem]'}`}></div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Individual Link Toggles */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ẩn/hiện từng nút tải</h4>
                {settings.links.filter(l => l.id !== 'win').map(link => {
                  const isLinkHidden = settings.hiddenLinks.includes(link.id);
                  return (
                    <div key={link.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800/30 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <PlatformIcon type={link.icon} size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 text-[11px] font-medium truncate">{link.platform} — {link.label}</span>
                        {isLinkHidden && <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-bold flex-shrink-0">ẨN</span>}
                      </div>
                      <button
                        onClick={() => toggleLinkVisibility(link.id)}
                        className={`relative w-9 h-[18px] rounded-full transition-all duration-300 flex-shrink-0 ml-2 ${isLinkHidden ? 'bg-slate-700' : 'bg-emerald-600'}`}
                      >
                        <div className={`absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all duration-300 ${isLinkHidden ? 'left-[2px]' : 'left-[1.125rem]'}`}></div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Edit Descriptions */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mô tả nền tảng</h4>
                {allPlatforms.map(platform => (
                  <div key={platform} className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">{platform}</label>
                    <input
                      type="text"
                      value={editDescriptions[platform] || ''}
                      onChange={e => setEditDescriptions({ ...editDescriptions, [platform]: e.target.value })}
                      placeholder={DEFAULT_PLATFORM_DESCRIPTIONS[platform] || 'Mô tả...'}
                      className="w-full h-7 bg-slate-900 border border-slate-800 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                    />
                  </div>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mẹo cuối panel</h4>
                <textarea
                  value={editFooterTip}
                  onChange={e => setEditFooterTip(e.target.value)}
                  placeholder="Nội dung mẹo hiển thị cuối panel..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-[10px] rounded-lg p-2.5 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* === ADMIN: EDIT LINKS VIEW === */}
          {adminView === 'edit-links' && (
            <div className="p-4 space-y-4">
              {/* Windows */}
              <div className="p-3 bg-slate-900/60 border border-slate-700/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-red-400" />
                  <span className="text-white text-xs font-bold">Windows</span>
                </div>
                <input
                  type="text"
                  value={editLabels['win'] || ''}
                  onChange={e => setEditLabels({ ...editLabels, win: e.target.value })}
                  placeholder="Tên nút (VD: Tải .zip)"
                  className="w-full h-7 bg-slate-800 border border-slate-700/50 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
                <input
                  type="text"
                  value={editUrls['win'] || ''}
                  onChange={e => setEditUrls({ ...editUrls, win: e.target.value })}
                  placeholder="URL download..."
                  className="w-full h-7 bg-slate-800 border border-amber-500/30 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-amber-400 transition-all placeholder:text-slate-600 font-mono"
                />
                <input
                  type="text"
                  value={editWinDesc}
                  onChange={e => setEditWinDesc(e.target.value)}
                  placeholder="Mô tả (VD: File .zip giải nén ra để chạy.)"
                  className="w-full h-7 bg-slate-800 border border-slate-700/50 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Other links */}
              {settings.links.filter(l => l.id !== 'win').map(link => (
                <div key={link.id} className="p-3 bg-slate-900/40 border border-slate-800/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <PlatformIcon type={link.icon} size={12} className="text-slate-500" />
                    <span className="text-slate-300 text-[11px] font-bold">{link.platform}</span>
                    {settings.hiddenLinks.includes(link.id) && <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-bold">ẨN</span>}
                  </div>
                  <input
                    type="text"
                    value={editLabels[link.id] || ''}
                    onChange={e => setEditLabels({ ...editLabels, [link.id]: e.target.value })}
                    placeholder={`Tên nút (VD: ${link.label})`}
                    className="w-full h-7 bg-slate-800 border border-slate-700/50 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                  <input
                    type="text"
                    value={editUrls[link.id] || ''}
                    onChange={e => setEditUrls({ ...editUrls, [link.id]: e.target.value })}
                    placeholder="URL download..."
                    className="w-full h-7 bg-slate-800 border border-amber-500/30 text-white text-[10px] rounded-lg px-2.5 outline-none focus:border-amber-400 transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {/* === NORMAL VIEW === */}
          {adminView === 'none' && (
            <>
              <div className="p-4 space-y-3">
                {/* Primary Download: Windows */}
                {(!isWinHidden || isAdmin) && (
                  <div className={`p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/40 rounded-2xl space-y-3 relative ${isWinHidden ? 'opacity-50' : ''}`}>
                    {isAdmin && isWinHidden && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-400 font-bold">ẨN với user</div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-600/10 border border-red-500/20 rounded-xl">
                        <Monitor size={20} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm">Tải về cho Windows</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">{settings.windowsDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-[11px] text-slate-400 font-medium">
                        <Monitor size={12} /> Nền tảng: <span className="text-white font-bold">Windows</span>
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] text-emerald-400 font-medium">
                        <Check size={11} /> Hỗ trợ tốt
                      </span>
                    </div>
                    <a
                      href={winLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    >
                      <Download size={15} /> {winLink.label}
                    </a>
                  </div>
                )}

                {/* All Other Visible Platforms - Shown Directly */}
                {visiblePlatformEntries.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {visiblePlatformEntries.map(([platform, links]) => {
                      const isPlatformHidden = settings.hiddenPlatforms.includes(platform);
                      const visibleLinks = links.filter(l => isAdmin || !settings.hiddenLinks.includes(l.id));
                      if (visibleLinks.length === 0 && !isAdmin) return null;

                      return (
                        <div
                          key={platform}
                          className={`p-3 bg-slate-900/60 border ${platformColors[platform] || 'border-slate-700/30'} rounded-2xl space-y-2.5 relative ${platform === 'Smart TV Khác' ? 'col-span-2 sm:col-span-1' : ''} ${isPlatformHidden ? 'opacity-50' : ''}`}
                        >
                          {isAdmin && isPlatformHidden && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] text-amber-400 font-bold">ẨN</div>
                          )}
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-red-600/10 border border-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
                              <PlatformIcon type={links[0].icon} size={14} className="text-red-400" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-white text-xs font-bold">{settings.platformLabels[platform] || platform}</h5>
                              <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">{settings.platformDescriptions[platform] || ''}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(isAdmin ? links : visibleLinks).map(link => {
                              const isLinkHidden = settings.hiddenLinks.includes(link.id);
                              return (
                                <a
                                  key={link.id}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 ${isLinkHidden ? 'bg-slate-700/60 opacity-50 line-through' : 'bg-red-600/90 hover:bg-red-700'}`}
                                >
                                  <Download size={11} /> {link.label}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-900/30">
                <p className="text-slate-600 text-[10px] leading-relaxed text-center">
                  <span className="text-slate-500 font-bold">Mẹo:</span> {settings.footerTip}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const Footer = () => (
  <footer className="bg-slate-950 pt-16 pb-12 border-t border-slate-900 relative z-10 overflow-hidden">
    {/* Background Glow */}
    <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full h-64 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>

    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-16">
        {/* Column 1: Brand */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:rotate-6 transition-transform">
              <Clapperboard size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black italic tracking-[-0.075em] uppercase text-white">
              HÀ<span className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">MOVIE</span><span className="text-slate-300 text-lg ml-1">HOUSE</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Nền tảng xem phim trực tuyến hàng đầu Việt Nam. Chất lượng cao, trải nghiệm mượt mà, nội dung cập nhật liên tục 24/7.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/NguyenManhHaOfficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all hover:-translate-y-1 text-sm font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Column 2: QR Donate */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <h4 className="text-white font-black text-sm uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Ủng Hộ Duy Trì Web</h4>
          <div className="bg-white rounded-2xl p-2 shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-shadow">
            <img
              src="https://img.vietqr.io/image/MB-99660999999999-print.png?accountName=NGUYEN%20MANH%20HA"
              alt="QR Donate - MB Bank - NGUYEN MANH HA"
              className="w-48 h-auto rounded-xl"
              loading="lazy"
            />
          </div>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm text-center md:text-right italic">
            "Mọi sự nỗ lực xây web này đều là miễn phí, một chút tấm lòng cũng sẽ không làm mình giàu thêm, nhưng sẽ hỗ trợ web được lâu ^^"
          </p>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} <span className="text-slate-500">HÀ MOVIE HOUSE</span>. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Made with ❤️ for Movie Lovers</p>
        </div>
      </div>
    </div>
  </footer>
);

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-[80] p-3 rounded-full bg-slate-900/40 backdrop-blur-md text-indigo-500 border border-white/5 opacity-30 active:opacity-100 transition-all duration-300 shadow-2xl"
      aria-label="Scroll to top"
    >
      <ChevronUp size={24} />
    </button>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans">
      <Header />
      <main className={`flex-1 w-full ${isHomePage ? '' : 'pt-20 md:pt-24 px-4 md:px-[3cm] mx-auto'}`}>
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};
