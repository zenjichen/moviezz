
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenPublicRooms, cleanupOldPublicRooms, PublicRoomEntry } from '../services/firebase';
import { getImageUrl } from '../services/api';
import { Users, Globe, Lock, Clock, Play, Tv } from 'lucide-react';

const timeAgo = (ts: number): string => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  return `${Math.floor(diff / 3600)}h trước`;
};

export const PublicRoomsPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<PublicRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // force re-render to update timeAgo

  useEffect(() => {
    document.title = 'Phòng Xem Chung - Hà Movie House';

    // Run cleanup of 7-day-old entries once
    cleanupOldPublicRooms();

    // Real-time listener
    const unsub = listenPublicRooms(data => {
      setRooms(data);
      setLoading(false);
    });

    // Periodic tick every 30s to re-filter stale rooms and update timeAgo display
    const ticker = setInterval(() => setTick(t => t + 1), 30_000);

    return () => {
      unsub();
      clearInterval(ticker);
      document.title = 'Hà Movie House - Xem Phim Online';
    };
  }, []);

  // Client-side filter: remove rooms inactive > 30 min or older than 7 days
  const THIRTY_MIN = 30 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const visibleRooms = rooms.filter(r =>
    (now - r.lastActive < THIRTY_MIN) && (now - r.createdAt < SEVEN_DAYS)
  );


  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Phòng Xem Chung</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tham gia xem phim cùng cộng đồng</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {visibleRooms.length} phòng đang hoạt động
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!loading && visibleRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
            <Tv size={36} className="text-slate-600" />
          </div>
          <h3 className="text-white font-black text-lg">Chưa có phòng nào</h3>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            Chưa có phòng xem chung công khai nào đang hoạt động.<br />
            Hãy tạo phòng và bật chế độ Công khai!
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" /> Chọn phim và tạo phòng
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-800" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-800 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-800 rounded-lg w-1/2" />
                <div className="h-8 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Grid */}
      {!loading && visibleRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRooms.map(room => (
            <div
              key={room.roomId}
              className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/20 hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                {room.movieThumb ? (
                  <img
                    src={getImageUrl(room.movieThumb)}
                    alt={room.movieName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tv size={40} className="text-slate-700" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/90 text-white rounded-full text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-slate-900/90 text-slate-300 rounded-full text-[10px] font-bold border border-slate-700">
                    <Users size={9} /> {room.memberCount}
                  </span>
                </div>

                {/* Episode badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded-lg text-[10px] font-bold backdrop-blur-sm">
                  Tập {room.episodeName}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-black text-sm mb-1 truncate">{room.movieName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="text-base">{room.hostEmoji}</span>
                  <span>Host: <span className="text-slate-400 font-bold">{room.hostName}</span></span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock size={10} />
                    {timeAgo(room.lastActive)}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/xem-chung/${room.roomId}`)}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-600/30"
                >
                  <Play size={14} fill="currentColor" /> Tham gia phòng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-slate-700 text-xs mt-8">
        Chỉ hiển thị phòng hoạt động trong 30 phút gần nhất • Phòng tự xóa khi host rời
      </p>
    </div>
  );
};
