
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { MovieDetail, ServerData, Episode } from '../types';
import { storage } from '../utils/storage';
import {
  generateUserId, generateRoomId, getRandomEmoji,
  createRoom, getRoom, joinRoom, updatePlayback, updateEpisode,
  sendChat, listenRoom, listenChat, updateLastSeen, removeRoom,
  setRoomVisibility, updatePublicRoomActivity,
  getLocalUser, saveLocalUser,
  RoomData, ChatMessage, MemberData
} from '../services/firebase';
import {
  Users, Send, Copy, Check, X, Crown, Play, Pause,
  ChevronLeft, ChevronRight, Settings, Mic2, List,
  Link as LinkIcon, LogOut, Loader2, Globe, Lock, Eye, EyeOff
} from 'lucide-react';
import Hls from 'hls.js';

// ── VideoPlayer with sync support ────────────────────────
interface SyncPlayerProps {
  src: string;
  fallbackSrc?: string;
  poster?: string;
  isHost: boolean;
  syncState: { isPlaying: boolean; currentTime: number; updatedAt: number } | null;
  onPlayPause: (isPlaying: boolean, currentTime: number) => void;
  onSeek: (currentTime: number) => void;
}

const SyncVideoPlayer: React.FC<SyncPlayerProps> = ({
  src, fallbackSrc, poster, isHost, syncState, onPlayPause, onSeek
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSyncRef = useRef<number>(0);
  const isEmbedRef = useRef(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const isEmbed = src && !src.toLowerCase().includes('.m3u8') && !src.toLowerCase().includes('.mp4');
  isEmbedRef.current = isEmbed;

  // Setup HLS
  useEffect(() => {
    if (isEmbed || isUsingFallback || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({ maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHasError(false);
        if (syncState?.isPlaying) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (fallbackSrc) setIsUsingFallback(true);
          else setHasError(true);
          hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    // Host: emit play/pause/seek events
    const onPlay = () => { if (isHost) onPlayPause(true, video.currentTime); };
    const onPause = () => { if (isHost) onPlayPause(false, video.currentTime); };
    const onSeeked = () => { if (isHost) onSeek(video.currentTime); };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [src, isEmbed, isUsingFallback]);

  // Guest: apply sync state
  useEffect(() => {
    if (isHost || !syncState || !videoRef.current || isEmbedRef.current) return;
    const video = videoRef.current;
    const { isPlaying, currentTime, updatedAt } = syncState;
    if (updatedAt === lastSyncRef.current) return;
    lastSyncRef.current = updatedAt;

    const elapsed = (Date.now() - updatedAt) / 1000;
    const targetTime = currentTime + (isPlaying ? elapsed : 0);

    if (Math.abs(video.currentTime - targetTime) > 2) {
      video.currentTime = targetTime;
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 2000);
    }

    if (isPlaying && video.paused) video.play().catch(() => {});
    if (!isPlaying && !video.paused) video.pause();
  }, [syncState, isHost]);

  if (isEmbed || isUsingFallback) {
    const finalUrl = isUsingFallback ? (fallbackSrc || src) : src;
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {!isHost && (
          <div className="absolute top-3 left-3 z-20 bg-amber-500/90 text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            ⚠️ Embed – tự sync thủ công theo host
          </div>
        )}
        <iframe src={finalUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      {showSyncToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-indigo-600/90 text-white px-4 py-1.5 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2">
          🔄 Đã đồng bộ với host
        </div>
      )}
      {!isHost && (
        <div className="absolute top-3 right-3 z-20 bg-slate-900/80 text-slate-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
          <Crown size={10} className="text-amber-400" /> Host điều khiển
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={isHost}
        controlsList={isHost ? undefined : 'noplaybackrate'}
        poster={poster}
        playsInline
      />
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
          <p className="text-white font-bold mb-4">Lỗi phát video</p>
        </div>
      )}
    </div>
  );
};

// ── Join Screen ──────────────────────────────────────────
const JoinScreen = ({ roomId, onJoin }: { roomId: string; onJoin: (name: string) => void }) => {
  const [name, setName] = useState('');
  const local = getLocalUser();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-600 rounded-2xl">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">Xem chung</h1>
            <p className="text-slate-500 text-xs font-mono">Phòng: {roomId}</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-6">Nhập tên để tham gia phòng xem phim cùng bạn bè!</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
          placeholder={local?.name || 'Tên của bạn...'}
          className="w-full h-12 bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 mb-4"
          autoFocus
          maxLength={20}
        />
        <button
          onClick={() => {
            const finalName = name.trim() || local?.name || 'Khán giả';
            onJoin(finalName);
          }}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play size={18} fill="currentColor" /> Vào phòng
        </button>
      </div>
    </div>
  );
};

// ── Main Watch Together Page ─────────────────────────────
export const WatchTogetherPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // User state
  const [userId] = useState(() => {
    const local = getLocalUser();
    return local?.id || generateUserId();
  });
  const [userName, setUserName] = useState<string | null>(() => getLocalUser()?.name || null);
  const [userEmoji] = useState(() => getLocalUser()?.emoji || getRandomEmoji());
  const [joined, setJoined] = useState(false);

  // Room state
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Movie/player state
  const [serverList, setServerList] = useState<ServerData[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<[string, ChatMessage][]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const lastSyncRef = useRef<number>(0);

  const isHost = room?.hostId === userId;
  const shareUrl = `${window.location.origin}${window.location.pathname}#/xem-chung/${roomId}`;

  const handleTogglePublic = async () => {
    if (!room || !roomId) return;
    const newPublic = !room.isPublic;
    const memberCount = Object.keys(room.members || {}).length;
    await setRoomVisibility(roomId, newPublic, newPublic ? {
      movieName: room.movieName,
      movieThumb: room.movieThumb,
      episodeName: room.episodeName,
      hostName: room.hostName,
      hostEmoji: room.hostEmoji,
      memberCount,
      lastActive: Date.now(),
      createdAt: room.createdAt,
    } : undefined);
  };

  // Load movie data
  useEffect(() => {
    if (!room?.movieSlug) return;
    api.getMovieDetail(room.movieSlug).then(res => {
      if (res.status) setServerList(res.episodes);
    });
  }, [room?.movieSlug]);

  // Sync episode/server from room
  useEffect(() => {
    if (!room || serverList.length === 0) return;
    const sv = serverList[room.serverIndex];
    if (!sv) return;
    const ep = sv.server_data.find(e => e.slug === room.episodeSlug);
    if (ep) {
      if (ep.slug !== currentEpisode?.slug || room.serverIndex !== undefined) {
        setCurrentEpisode(ep);
        setPlayerKey(k => k + 1);
      }
    }
  }, [room?.episodeSlug, room?.serverIndex, serverList]);

  // Subscribe to room
  useEffect(() => {
    if (!roomId || !joined) return;
    const unsub = listenRoom(roomId, data => {
      if (!data) { setNotFound(true); return; }
      setRoom(data);
      setLoading(false);
    });
    return unsub;
  }, [roomId, joined]);

  // Subscribe to chat
  useEffect(() => {
    if (!roomId || !joined) return;
    const unsub = listenChat(roomId, msgs => {
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [roomId, joined]);

  // Heartbeat: update lastSeen + sync public room activity
  useEffect(() => {
    if (!roomId || !joined) return;
    const interval = setInterval(() => {
      updateLastSeen(roomId, userId);
      if (room?.isPublic) {
        const memberCount = Object.keys(room.members || {}).length;
        updatePublicRoomActivity(roomId, memberCount, room.episodeName);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [roomId, joined, userId, room?.isPublic, room?.members, room?.episodeName]);

  // Check room exists on initial load
  useEffect(() => {
    if (!roomId) return;
    const local = getLocalUser();
    if (local?.name) {
      // Auto-rejoin if already have a name
    }
    setLoading(false);
  }, [roomId]);

  const handleJoin = async (name: string) => {
    if (!roomId) return;
    setLoading(true);

    // Check room exists
    const existingRoom = await getRoom(roomId);
    if (!existingRoom) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const user = { id: userId, name, emoji: userEmoji };
    saveLocalUser(user);
    setUserName(name);

    await joinRoom(roomId, userId, {
      name, emoji: userEmoji, isHost: existingRoom.hostId === userId, lastSeen: Date.now()
    });

    // Send join system message
    await sendChat(roomId, {
      uid: 'system', name: 'System', emoji: '📢', type: 'system',
      text: `${userEmoji} ${name} đã vào phòng!`, ts: Date.now()
    });

    setJoined(true);
  };

  const handlePlayPause = useCallback(async (isPlaying: boolean, currentTime: number) => {
    if (!roomId || !isHost) return;
    await updatePlayback(roomId, { isPlaying, currentTime, updatedAt: Date.now() });
  }, [roomId, isHost]);

  const handleSeek = useCallback(async (currentTime: number) => {
    if (!roomId || !isHost) return;
    await updatePlayback(roomId, {
      isPlaying: !document.querySelector('video')?.paused,
      currentTime, updatedAt: Date.now()
    });
  }, [roomId, isHost]);

  const handleEpisodeChange = async (ep: Episode, serverIndex?: number) => {
    if (!roomId || !isHost || !room) return;
    const sv = serverIndex ?? room.serverIndex;
    await updateEpisode(roomId, ep.slug, ep.name, sv);
    await sendChat(roomId, {
      uid: 'system', name: 'System', emoji: '🎬', type: 'system',
      text: `Host chuyển sang Tập ${ep.name}`, ts: Date.now()
    });
    setShowEpisodes(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !roomId || !userName) return;
    await sendChat(roomId, {
      uid: userId, name: userName, emoji: userEmoji,
      text: chatInput.trim(), ts: Date.now(), type: 'chat'
    });
    setChatInput('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    if (isHost) {
      const confirmed = window.confirm('Bạn là host. Rời phòng sẽ đóng phòng cho tất cả. Tiếp tục?');
      if (!confirmed) return;
      await sendChat(roomId, {
        uid: 'system', name: 'System', emoji: '🚪', type: 'system',
        text: 'Host đã đóng phòng.', ts: Date.now()
      });
      await removeRoom(roomId);
    }
    navigate(-1);
  };

  // Loading / not-joined screen
  if (!joined) {
    if (notFound) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">😢</p>
            <h2 className="text-white text-xl font-black mb-2">Phòng không tồn tại</h2>
            <p className="text-slate-500 mb-6">Link đã hết hạn hoặc host đã đóng phòng.</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Về trang chủ</button>
          </div>
        </div>
      );
    }
    // Always show JoinScreen (saved name is pre-filled as placeholder)
    return <JoinScreen roomId={roomId!} onJoin={handleJoin} />;
  }

  if (!room || !currentEpisode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  const sv = serverList[room.serverIndex];
  const episodes = sv?.server_data || [];
  const currentIdx = episodes.findIndex(e => e.slug === currentEpisode.slug);
  const prevEp = currentIdx > 0 ? episodes[currentIdx - 1] : null;
  const nextEp = currentIdx < episodes.length - 1 ? episodes[currentIdx + 1] : null;

  const serverName = sv?.server_name || '';
  const isNguonC = serverName.includes('NguonC');
  const playerSrc = isNguonC ? currentEpisode.link_embed : (currentEpisode.link_m3u8 || currentEpisode.link_embed);

  const members = Object.entries(room.members || {}) as [string, MemberData][];
  const onlineMembers = members.filter(([, m]) => Date.now() - (m as MemberData).lastSeen < 30000);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-indigo-600 rounded-xl flex-shrink-0">
            <Users size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm truncate max-w-[160px]">{room.movieName}</span>
              {isHost && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-md border border-amber-500/20 flex-shrink-0">HOST</span>}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="font-mono">#{roomId}</span>
              <span>•</span>
              <span>{onlineMembers.length} người đang xem</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Public/Private toggle - host only */}
          {isHost && (
            <button
              onClick={handleTogglePublic}
              className={`flex items-center gap-1.5 h-8 px-3 border text-xs font-bold rounded-xl transition-all ${
                room.isPublic
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={room.isPublic ? 'Đang công khai — nhấn để đặt riêng tư' : 'Đang riêng tư — nhấn để công khai'}
            >
              {room.isPublic ? <Globe size={12} /> : <Lock size={12} />}
              {room.isPublic ? 'Công khai' : 'Riêng tư'}
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 h-8 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Đã copy!' : 'Share'}
          </button>
          <button onClick={handleLeave} className="h-8 w-8 flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-xl transition-all">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video + Controls */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Player */}
          <SyncVideoPlayer
            key={playerKey}
            src={playerSrc}
            fallbackSrc={currentEpisode.link_embed}
            poster={room.movieThumb}
            isHost={isHost}
            syncState={room.playback}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
          />

          {/* Episode nav */}
          <div className="flex items-center justify-between gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-white font-bold text-sm">{room.movieName} – Tập {currentEpisode.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Settings size={11} />
                <span>Server: <span className="text-indigo-400 font-bold">{serverName.replace('OPhim - ', '').replace('NguonC - ', '').replace('VSMov - ', '')}</span></span>
                {!isHost && <span className="text-amber-500">• Chỉ host điều khiển</span>}
              </div>
            </div>
            {isHost && (
              <div className="flex items-center gap-2">
                {prevEp && (
                  <button onClick={() => handleEpisodeChange(prevEp)} className="h-9 px-3 flex items-center gap-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all">
                    <ChevronLeft size={14} /> Trước
                  </button>
                )}
                <button onClick={() => setShowEpisodes(!showEpisodes)} className="h-9 px-3 flex items-center gap-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all">
                  <List size={14} /> Tập
                </button>
                {nextEp && (
                  <button onClick={() => handleEpisodeChange(nextEp)} className="h-9 px-3 flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all">
                    Tiếp <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Episode grid (host only) */}
          {showEpisodes && isHost && episodes.length > 0 && (
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <List size={12} /> Danh sách tập
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                {episodes.map(ep => (
                  <button
                    key={ep.slug}
                    onClick={() => handleEpisodeChange(ep)}
                    className={`py-2 rounded-xl text-center text-xs font-bold transition-all ${ep.slug === currentEpisode.slug ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {ep.name}
                  </button>
                ))}
              </div>

              {/* Server selector */}
              {serverList.length > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-2 flex items-center gap-1"><Mic2 size={10} /> Server</p>
                  <div className="flex flex-wrap gap-2">
                    {serverList.map((sv, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const ep = sv.server_data.find(e => e.slug === currentEpisode.slug) || sv.server_data[0];
                          if (ep) handleEpisodeChange(ep, idx);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${room.serverIndex === idx ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {sv.server_name.replace('OPhim - ', '').replace('NguonC - ', '').replace('VSMov - ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Members + Chat */}
        <div className="hidden md:flex w-80 flex-col border-l border-slate-800 bg-slate-900/30">
          {/* Members */}
          <div className="p-3 border-b border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Users size={11} /> Đang xem ({onlineMembers.length})
            </p>
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {members.map(([uid, m]) => {
                const isOnline = Date.now() - m.lastSeen < 30000;
                return (
                  <div key={uid} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isOnline ? 'bg-slate-800/50' : 'opacity-40'}`}>
                    <span className="text-base">{m.emoji}</span>
                    <span className="text-white text-xs font-bold flex-1 truncate">{m.name}</span>
                    {m.isHost && <Crown size={11} className="text-amber-400 flex-shrink-0" />}
                    {uid === userId && <span className="text-[9px] text-indigo-400 font-bold flex-shrink-0">Bạn</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">💬 Chat</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(([id, msg]) => (
                <div key={id} className={`${msg.type === 'system' ? 'text-center' : ''}`}>
                  {msg.type === 'system' ? (
                    <p className="text-[10px] text-slate-600 italic">{msg.text}</p>
                  ) : (
                    <div className={`flex gap-2 ${msg.uid === userId ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm flex-shrink-0">{msg.emoji}</span>
                      <div className={`max-w-[75%] ${msg.uid === userId ? 'items-end' : 'items-start'} flex flex-col`}>
                        <span className="text-[9px] text-slate-600 mb-0.5 px-1">{msg.name}</span>
                        <div className={`px-3 py-1.5 rounded-2xl text-xs font-medium ${msg.uid === userId ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Nhắn gì đó..."
                  className="flex-1 h-9 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-all"
                  maxLength={200}
                />
                <button onClick={handleSendChat} className="h-9 w-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex-shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
