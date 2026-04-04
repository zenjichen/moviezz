
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { WatchPage } from './pages/WatchPage';
import { SearchPage } from './pages/SearchPage';
import { CategoryPage } from './pages/CategoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { FilterPage } from './pages/FilterPage';
import { Clapperboard, Play } from 'lucide-react';
import { api, getImageUrl } from './services/api';

// Helper functions for session cookies
const setSessionCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
};

const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const WelcomePopup = ({ onEnter }: { onEnter: () => void }) => {
  const [bgUrl, setBgUrl] = useState('');
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [showWhiteFade, setShowWhiteFade] = useState(false);

  useEffect(() => {
    api.getNewUpdates(1).then(res => {
      const items = res.items || [];
      if (items.length > 0) {
        const randomMovie = items[Math.floor(Math.random() * items.length)];
        const url = getImageUrl(randomMovie.poster_url || randomMovie.thumb_url);

        // Preload image
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setBgUrl(url);
          setIsBgLoaded(true);
        };
      }
    }).catch(err => console.error("Error loading welcome background:", err));
  }, []);

  const handleStart = () => {
    // Giai đoạn 1: Xoay nhanh dần và nút biến mất trong 1.5 giây
    setIsAccelerating(true);

    setTimeout(() => {
      // Giai đoạn 2: Bùng nổ/Vỡ tan trong 1 giây (Tổng: 2.5s)
      setIsTransitioning(true);

      // Đợi cú zoom đạt đỉnh
      setTimeout(() => {
        // Giai đoạn 3: Hiện màn trắng và bắt đầu mờ dần vào trang chủ (Tổng: 4.0s)
        setShowWhiteFade(true);

        // Màn trắng mờ dần trong 1.5 giây
        setTimeout(() => {
          onEnter();
        }, 1500);
      }, 1000);
    }, 1500);
  };

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-slate-950 overflow-hidden transition-all duration-[1500ms] ${showWhiteFade ? 'opacity-0' : 'opacity-100'}`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Lớp màn trắng chuyển cảnh cuối cùng */}
      <div
        className={`absolute inset-0 z-[100] bg-white transition-opacity duration-[1500ms] pointer-events-none ${showWhiteFade ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'opacity' }}
      ></div>

      {/* Dynamic Background Image - Optimized transition */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ${isTransitioning
          ? 'scale-[1.8] opacity-0 blur-2xl'
          : isBgLoaded ? 'opacity-40 blur-sm scale-100' : 'opacity-0 scale-100'
          }`}
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform, opacity, filter',
          transform: 'translateZ(0)'
        }}
      ></div>

      {/* Background decoration overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80"></div>
        <div
          className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full transition-transform duration-[1000ms] ${isTransitioning ? 'scale-[3]' : 'scale-100'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        ></div>
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full transition-transform duration-[1000ms] ${isTransitioning ? 'scale-[3]' : 'scale-100'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        ></div>
      </div>

      {/* Speed Lines Effect */}
      {isTransitioning && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/40 rounded-full animate-hyperspace"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 150 + 100 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 0.4 + 's',
                transform: `rotate(${Math.random() * 360}deg)`,
                willChange: 'transform, opacity'
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Explosive Flash */}
      <div className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-700 ${isTransitioning ? 'opacity-40 animate-flash' : 'opacity-0'}`}></div>

      <div
        className={`relative z-10 text-center flex flex-col items-center px-4 transition-all duration-[1000ms] ${isTransitioning ? 'scale-[12] blur-xl opacity-0' : 'scale-100 animate-in fade-in zoom-in'}`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform, opacity, filter',
          transform: 'translateZ(0)'
        }}
      >
        {/* Logo Container */}
        <div className={`relative mb-6 md:mb-10 group transition-all duration-300 ${isAccelerating ? 'animate-logo-spin-up' : ''}`}>
          {/* Enhanced Dual Rotating Border Effect */}
          {isTransitioning && (
            <>
              <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 rounded-full animate-spin-fast blur-xl opacity-100"></div>
              <div className="absolute -inset-6 bg-gradient-to-l from-indigo-300 via-white to-purple-300 rounded-full animate-spin-slow blur-md opacity-100"></div>
            </>
          )}

          <div className="relative w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.5)] rotate-12 border border-white/20 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full ${isTransitioning ? 'animate-[shimmer_0.4s_infinite]' : ''}`}></div>
            <Clapperboard size={40} className="text-white -rotate-12 md:hidden" />
            <Clapperboard size={56} className="text-white -rotate-12 hidden md:block" />
          </div>
        </div>

        <div
          className={`transition-all duration-[800ms] ${isTransitioning ? 'opacity-0 translate-y-20 blur-md' : 'opacity-100 translate-y-0'}`}
          style={{ transitionTimingFunction: 'ease-out' }}
        >
          <h1 className="text-5xl md:text-9xl font-black italic tracking-[-0.075em] text-white mb-4 md:mb-6 uppercase">
            HÀ <span className="text-indigo-500 drop-shadow-[0_0_25px_rgba(99,102,241,0.8)]">MOVIE</span><span className="text-slate-300 text-3xl md:text-6xl ml-2"> HOUSE</span>
          </h1>
          <p className="text-slate-400 text-base md:text-2xl mb-8 md:mb-14 max-w-lg mx-auto font-medium tracking-wide">
            Chào mừng các bạn đến vơi rạp chiếu phim online miễn phí với chất lượng tuyệt đỉnh. ❤️<br className="hidden md:block" /> <span className="text-slate-500"> Đây là một trong những sản phẩm tạo ra với mục đích học tập và không thương mại hoá !</span>
          </p>

          <button
            onClick={handleStart}
            disabled={isTransitioning || isAccelerating || showWhiteFade}
            className={`group relative inline-flex items-center gap-4 px-10 py-5 md:px-12 md:py-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 rounded-full font-black text-xl md:text-2xl shadow-[0_10px_40px_rgba(245,158,11,0.5)] hover:shadow-amber-500/60 hover:scale-105 active:scale-95 transition-all duration-700 overflow-hidden ${isAccelerating ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <Play size={24} className="fill-slate-900 relative z-10 md:hidden" />
            <Play size={28} className="fill-slate-900 relative z-10 hidden md:block" />
            <span className="relative z-10">XEM NGAY</span>
            <div className="absolute inset-0 rounded-full bg-white blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>

          <p className="mt-8 md:mt-10 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] animate-pulse" style={{
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a, #fbbf24, #f59e0b)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'goldShimmer 3s linear infinite',
            filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6)) drop-shadow(0 0 20px rgba(245,158,11,0.4)) drop-shadow(0 0 40px rgba(251,191,36,0.2))',
          }}>Premium Cinematic Experience</p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        .animate-spin-fast {
          animation: spin 0.25s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logo-spin-up {
          0% { transform: rotate(12deg); }
          20% { transform: rotate(60deg); }
          50% { transform: rotate(300deg); }
          80% { transform: rotate(1000deg); }
          100% { transform: rotate(2000deg); }
        }
        .animate-logo-spin-up {
          animation: logo-spin-up 1.5s ease-in forwards;
        }
        @keyframes flash {
          0% { opacity: 0; }
          40% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes hyperspace {
          0% { transform: scale(0) translateY(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(4) translateY(1000px); opacity: 0; }
        }
        .animate-hyperspace {
          animation: hyperspace 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes goldShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
};

function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = getCookie('phat_movie_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Typewriter effect for browser tab title
  useEffect(() => {
    const fullTitle = 'Hà Movie House - Xem Phim Online Miễn Phí 🎬';
    let i = 0;
    let isDeleting = false;
    let showCursor = true;
    let timer: ReturnType<typeof setTimeout>;

    // Blinking cursor toggle
    const cursorInterval = setInterval(() => {
      showCursor = !showCursor;
      const text = fullTitle.slice(0, i);
      document.title = text + (showCursor ? '|' : ' ');
    }, 500);

    const tick = () => {
      const cursor = showCursor ? '|' : ' ';
      if (!isDeleting) {
        i++;
        document.title = fullTitle.slice(0, i) + cursor;
        if (i >= fullTitle.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2500);
          return;
        }
        timer = setTimeout(tick, 150); // slower typing
      } else {
        i--;
        document.title = fullTitle.slice(0, i) + cursor;
        if (i <= 0) {
          isDeleting = false;
          timer = setTimeout(tick, 800);
          return;
        }
        timer = setTimeout(tick, 30); // fast deleting
      }
    };

    timer = setTimeout(tick, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleEnter = () => {
    setSessionCookie('phat_movie_welcome_seen', 'true');
    setShowWelcome(false);
  };

  return (
    <>
      {showWelcome && <WelcomePopup onEnter={handleEnter} />}
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/phim/:slug" element={<MovieDetailPage />} />
            <Route path="/xem-phim/:slug/:episodeSlug" element={<WatchPage />} />
            <Route path="/tim-kiem" element={<SearchPage />} />
            <Route path="/danh-sach/:type" element={<CategoryPage />} />
            <Route path="/the-loai/:slug" element={<FilterPage />} />
            <Route path="/quoc-gia/:slug" element={<FilterPage />} />
            <Route path="/yeu-thich" element={<FavoritesPage />} />
            <Route path="/lich-su" element={<HistoryPage />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;
