
import { ApiResponseList, ApiResponseSearch, MovieDetail, ServerData } from '../types';

const BASE_URL = 'https://phimapi.com';
const NGUONC_BASE_URL = 'https://phim.nguonc.com/api';
const OPHIM_BASE_URL = 'https://ophim1.com';
const VSMOV_BASE_URL = 'https://vsmov.com/api';

const IMG_PREFIX = 'https://phimimg.com/';
const NGUONC_IMG_PREFIX = 'https://phim.nguonc.com/';
const OPHIM_IMG_HOST = 'https://img.ophim1.com/';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * The OPhim API currently returns paths such as "uploads/movies/foo.jpg".
 * Older code added "uploads/movies/" once again, resulting in 404 thumbnail
 * URLs. Keep the normalisation in one place so list and detail pages agree.
 */
const toOPhimImageUrl = (url: string) => {
  if (!url || url.startsWith('http')) return url;
  const path = url.replace(/^\/+/, '');
  return `${OPHIM_IMG_HOST}${path.startsWith('uploads/') ? path : `uploads/movies/${path}`}`;
};

/** Fail fast instead of leaving the UI blocked by an unresponsive provider. */
const fetchJson = async (url: string, timeout = REQUEST_TIMEOUT_MS): Promise<any> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
};

// Normalize OPhim items: add full image URL prefix for relative paths
const normalizeOPhimItems = (items: any[]): any[] => {
  return items.map(item => {
    const m = { ...item };
    if (m.thumb_url && !m.thumb_url.startsWith('http')) {
      m.thumb_url = toOPhimImageUrl(m.thumb_url);
    }
    if (m.poster_url && !m.poster_url.startsWith('http')) {
      m.poster_url = toOPhimImageUrl(m.poster_url);
    }
    return m;
  });
};

export const getImageUrl = (url: string) => {
  if (!url) return '';

  // Loading every image through images.weserv.nl made the entire catalogue
  // depend on one third-party proxy. Direct image requests are cacheable by the
  // browser and do not require CORS permission for <img> elements.
  if (url.startsWith('http')) return url;
  
  let fullUrl = '';
  if (url.startsWith('//')) {
    fullUrl = `https:${url}`;
  } else {
    fullUrl = `${IMG_PREFIX}${url}`;
  }

  return fullUrl;
};

// Normalize VSMov items (images are already absolute URLs)
const normalizeVSMovItems = (items: any[]): any[] => {
  return items.map(item => ({
    ...item,
    thumb_url: item.thumb_url || item.poster_url || '',
    poster_url: item.poster_url || item.thumb_url || ''
  }));
};

export const api = {
  // === PRIMARY: OPhim | FALLBACK: PhimAPI | EXTRA: VSMov ===

  getNewUpdates: async (page = 1): Promise<ApiResponseList<any>> => {
    try {
      const [ophimRes, vsmovRes] = await Promise.allSettled([
        fetchJson(`${OPHIM_BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`),
        fetchJson(`${VSMOV_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`)
      ]);

      const ophimItems = (ophimRes.status === 'fulfilled' && ophimRes.value?.status === 'success')
        ? normalizeOPhimItems(ophimRes.value.data?.items || [])
        : [];
      const vsmovItems = (vsmovRes.status === 'fulfilled' && vsmovRes.value?.status === true)
        ? normalizeVSMovItems(vsmovRes.value.items || [])
        : [];

      // Merge: OPhim first, then VSMov (dedup by slug)
      const seenSlugs = new Set(ophimItems.map((m: any) => m.slug));
      const merged = [...ophimItems];
      vsmovItems.forEach((m: any) => {
        if (!seenSlugs.has(m.slug)) {
          merged.push(m);
          seenSlugs.add(m.slug);
        }
      });

      if (merged.length > 0) {
        const pagination = (ophimRes.status === 'fulfilled' && ophimRes.value?.data?.params?.pagination)
          ? ophimRes.value.data.params.pagination
          : (vsmovRes.status === 'fulfilled' ? vsmovRes.value?.pagination || {} : {});
        return { status: true, items: merged, pathImage: '', pagination } as any;
      }
      throw new Error('All sources failed');
    } catch {
      try {
        return await fetchJson(`${BASE_URL}/danh-sach/phim-moi-cap-nhat-v3?page=${page}`);
      } catch {
        return await fetchJson(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
      }
    }
  },

  getMoviesByType: async (type: string, limit = 18, page = 1, category = '', country = '', year = '', lang = '') => {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        sort_field: 'modified.time',
        sort_type: 'desc'
      };
      if (category) params.category = category;
      if (country) params.country = country;
      if (year) params.year = year;
      if (lang) params.sort_lang = lang;

      const query = new URLSearchParams(params);
      const json = await fetchJson(`${OPHIM_BASE_URL}/v1/api/danh-sach/${type}?${query.toString()}`);
      if (json.status === 'success' && json.data?.items) {
        json.data.items = normalizeOPhimItems(json.data.items);
        return json;
      }
      throw new Error('OPhim failed');
    } catch {
      // Fallback to PhimAPI
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        sort_field: 'modified.time',
        sort_type: 'desc'
      };
      if (category) params.category = category;
      if (country) params.country = country;
      if (year) params.year = year;
      if (lang) params.sort_lang = lang;

      const query = new URLSearchParams(params);
      return fetchJson(`${BASE_URL}/v1/api/danh-sach/${type}?${query.toString()}`);
    }
  },

  getFilters: async (filterType: 'the-loai' | 'quoc-gia') => {
    try {
      const json = await fetchJson(`${OPHIM_BASE_URL}/v1/api/${filterType}`);
      if (json.status === 'success' && json.data?.items) {
        return json.data.items; // Return array directly: [{_id, name, slug}, ...]
      }
      throw new Error('OPhim filters failed');
    } catch {
      return fetchJson(`${BASE_URL}/${filterType}`);
    }
  },

  getFiltersItems: async (filterType: 'the-loai' | 'quoc-gia') => {
    try {
      const json = await fetchJson(`${OPHIM_BASE_URL}/v1/api/${filterType}`);
      if (json.status === 'success' && json.data?.items) {
        return json.data.items;
      }
      throw new Error('OPhim filters failed');
    } catch {
      return fetchJson(`${BASE_URL}/${filterType}`);
    }
  },

  getMoviesByFilter: async (filterType: 'the-loai' | 'quoc-gia', slug: string, page = 1, limit = 18) => {
    try {
      const json = await fetchJson(`${OPHIM_BASE_URL}/v1/api/${filterType}/${slug}?page=${page}&limit=${limit}`);
      if (json.status === 'success' && json.data?.items) {
        json.data.items = normalizeOPhimItems(json.data.items);
        return json;
      }
      throw new Error('OPhim filter failed');
    } catch {
      return fetchJson(`${BASE_URL}/v1/api/${filterType}/${slug}?page=${page}&limit=${limit}`);
    }
  },

  getMovieDetailMain: async (slug: string) => {
      try {
        return await fetchJson(`${BASE_URL}/phim/${slug}`);
      } catch (e) {
          return null;
      }
  },

  getMovieDetailOPhim: async (slug: string) => {
    try {
      const data = await fetchJson(`${OPHIM_BASE_URL}/v1/api/phim/${slug}`);
      if (data.status !== 'success' && !data.data?.item) return null;
      
      const m = data.data.item;
      const episodes: ServerData[] = (m.episodes || []).map((srv: any) => ({
        server_name: `OPhim - ${srv.server_name}`,
        server_data: srv.server_data.map((item: any) => ({
          name: item.name,
          slug: item.slug,
          filename: item.name,
          link_embed: item.link_embed,
          link_m3u8: item.link_m3u8
        }))
      }));

      let thumb = m.thumb_url;
      let poster = m.poster_url;
      thumb = toOPhimImageUrl(thumb);
      poster = toOPhimImageUrl(poster);

      const movie = {
        ...m,
        thumb_url: thumb,
        poster_url: poster
      };
      
      return { movie, episodes };
    } catch (e) {
      return null;
    }
  },

  getMovieDetailNguonC: async (slug: string) => {
    try {
      const data = await fetchJson(`${NGUONC_BASE_URL}/film/${slug}`);
      if (data.status !== 'success' && !data.movie) return null;
      
      const m = data.movie;
      const episodes: ServerData[] = (m.episodes || []).map((srv: any) => ({
        server_name: `NguonC - ${srv.server_name}`,
        server_data: srv.items.map((item: any) => ({
          name: item.name,
          slug: item.slug,
          filename: item.name,
          link_embed: item.embed,
          link_m3u8: item.m3u8
        }))
      }));
      
      return { movie: m, episodes };
    } catch (e) {
      return null;
    }
  },

  getMovieDetailVSMov: async (slug: string) => {
    try {
      const data = await fetchJson(`${VSMOV_BASE_URL}/phim/${slug}`);
      if (!data.status || !data.movie) return null;

      const m = data.movie;
      // VSMov episodes always [] currently, but map them if they exist in the future
      const episodes: ServerData[] = (m.episodes || []).map((srv: any) => ({
        server_name: `VSMov - ${srv.server_name || 'Server 1'}`,
        server_data: (srv.items || srv.server_data || []).map((item: any) => ({
          name: item.name,
          slug: item.slug,
          filename: item.name,
          link_embed: item.embed || item.link_embed,
          link_m3u8: item.m3u8 || item.link_m3u8
        }))
      }));

      return { movie: m, episodes };
    } catch (e) {
      return null;
    }
  },

  getMovieDetail: async (slug: string): Promise<{ status: boolean; movie: MovieDetail; episodes: ServerData[] }> => {
    const [mainRes, ophimRes, nguonCRes, vsmovRes] = await Promise.allSettled([
        api.getMovieDetailMain(slug),
        api.getMovieDetailOPhim(slug),
        api.getMovieDetailNguonC(slug),
        api.getMovieDetailVSMov(slug)
    ]);

    let mainMovie: MovieDetail | null = null;
    let allEpisodes: ServerData[] = [];
    let actorPool: Set<string> = new Set();

    const normalizeActors = (actorData: any): string[] => {
      if (!actorData) return [];
      let raw: string[] = [];
      if (Array.isArray(actorData)) raw = actorData;
      else if (typeof actorData === 'string') raw = actorData.split(',').map(s => s.trim());
      
      return raw
        .map(a => a.replace(/\s*\(.*?\)\s*/g, '').trim())
        .filter(a => a && !['đang cập nhật', 'n/a', 'none', 'unknown'].includes(a.toLowerCase()));
    };

    if (mainRes.status === 'fulfilled' && mainRes.value && mainRes.value.status) {
        mainMovie = { ...mainRes.value.movie };
        allEpisodes = [...mainRes.value.episodes];
        normalizeActors(mainMovie.actor).forEach(a => actorPool.add(a));
    }

    if (ophimRes.status === 'fulfilled' && ophimRes.value) {
        const m = ophimRes.value.movie;
        if (!mainMovie) {
            mainMovie = {
                _id: m._id,
                name: m.name,
                slug: m.slug,
                origin_name: m.origin_name,
                poster_url: m.poster_url,
                thumb_url: m.thumb_url,
                year: m.year,
                content: m.content,
                lang: m.lang,
                quality: m.quality,
                category: m.category || [],
                country: m.country || [],
                status: m.status || 'completed',
                is_copyright: false,
                sub_docquyen: false,
                chieurap: false,
                trailer_url: m.trailer_url || '',
                episode_current: m.episode_current || '',
                episode_total: m.episode_total || '',
                episodes: [],
                actor: []
            };
        }
        normalizeActors(m.actor).forEach(a => actorPool.add(a));
        allEpisodes = [...allEpisodes, ...ophimRes.value.episodes];
    }

    if (nguonCRes.status === 'fulfilled' && nguonCRes.value) {
        const m = nguonCRes.value.movie;
        if (!mainMovie) {
             let poster = m.poster_url || m.thumb_url;
             let thumb = m.thumb_url || m.poster_url;
             if (poster && !poster.startsWith('http')) poster = `${NGUONC_IMG_PREFIX}${poster}`;
             if (thumb && !thumb.startsWith('http')) thumb = `${NGUONC_IMG_PREFIX}${thumb}`;

             mainMovie = {
                _id: m._id || m.slug,
                name: m.name,
                slug: m.slug,
                origin_name: m.origin_name || m.name,
                poster_url: poster,
                thumb_url: thumb,
                year: m.year,
                content: m.description || m.content || 'Đang cập nhật...',
                lang: m.language || m.lang || 'N/A',
                quality: m.quality || 'HD',
                category: m.category ? (Array.isArray(m.category) ? m.category : Object.values(m.category)).map((c: any) => ({ id: c.name, name: c.name, slug: c.slug })) : [],
                country: m.country ? (Array.isArray(m.country) ? m.country : Object.values(m.country)).map((c: any) => ({ id: c.name, name: c.name, slug: c.slug })) : [],
                status: 'completed',
                is_copyright: false,
                sub_docquyen: false,
                chieurap: false,
                trailer_url: '',
                episode_current: '',
                episode_total: '',
                episodes: [],
                actor: []
             };
        }
        normalizeActors(m.actor || m.actors).forEach(a => actorPool.add(a));
        allEpisodes = [...allEpisodes, ...nguonCRes.value.episodes];
    }

    if (vsmovRes.status === 'fulfilled' && vsmovRes.value) {
        const m = vsmovRes.value.movie;
        if (!mainMovie) {
            mainMovie = {
                _id: m._id || m.slug,
                name: m.name,
                slug: m.slug,
                origin_name: m.origin_name || m.name,
                poster_url: m.poster_url || m.thumb_url || '',
                thumb_url: m.thumb_url || m.poster_url || '',
                year: m.year,
                content: m.content || 'Đang cập nhật...',
                lang: m.lang || 'N/A',
                quality: m.quality || 'HD',
                category: (m.category || []).map((c: any) => ({ id: c.id || c.name, name: c.name, slug: c.slug })),
                country: (m.country || []).map((c: any) => ({ id: c.id || c.name, name: c.name, slug: c.slug })),
                status: m.status || 'completed',
                is_copyright: m.is_copyright || false,
                sub_docquyen: m.sub_docquyen || false,
                chieurap: m.chieurap || false,
                trailer_url: m.trailer_url || '',
                episode_current: m.episode_current || '',
                episode_total: m.episode_total || '',
                episodes: [],
                actor: []
            };
        }
        normalizeActors(m.actor).forEach((a: string) => actorPool.add(a));
        allEpisodes = [...allEpisodes, ...vsmovRes.value.episodes];
    }

    if (!mainMovie) throw new Error("Movie not found");

    const finalActors = Array.from(actorPool).sort((a, b) => {
        const hasDiacritics = (s: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
        const aVn = hasDiacritics(a);
        const bVn = hasDiacritics(b);
        if (aVn && !bVn) return -1;
        if (!aVn && bVn) return 1;
        return a.localeCompare(b);
    });

    mainMovie.actor = finalActors.length > 0 ? finalActors : undefined;

    return {
        status: true,
        movie: mainMovie,
        episodes: allEpisodes
    };
  },

  searchMoviesCombined: async (keyword: string, limit = 24): Promise<any[]> => {
    // Stage 1: Attempt to find with the full name across all sources
    // OPhim often has better keyword indexing for actors, so we try multiple sources
    const fetchFromSources = async (kw: string) => {
      try {
        const [resOphim, resMain, resNguonc, resVsmov] = await Promise.allSettled([
          fetchJson(`${OPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&limit=${limit}`),
          fetchJson(`${BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&limit=${limit}`),
          fetchJson(`${NGUONC_BASE_URL}/search?keyword=${encodeURIComponent(kw)}`),
          fetchJson(`${VSMOV_BASE_URL}/tim-kiem?keyword=${encodeURIComponent(kw)}&limit=${limit}`)
        ]);

        const itemsOphim = resOphim.status === 'fulfilled' ? (resOphim.value.data?.items || resOphim.value.items || []) : [];
        const itemsMain = resMain.status === 'fulfilled' ? (resMain.value.data?.items || resMain.value.items || []) : [];
        const itemsNguonc = resNguonc.status === 'fulfilled' ? (resNguonc.value.data?.items || resNguonc.value.items || []) : [];
        const itemsVsmov = resVsmov.status === 'fulfilled' ? (resVsmov.value.items || []) : [];

        // Priority merge: OPhim results often match actor keywords better than Main Source which is very title-strict
        const combined = [...itemsOphim];
        const seenSlugs = new Set(combined.map(m => m.slug));

        // Process OPhim images if they were selected as priority
        combined.forEach((m: any) => {
            m.thumb_url = toOPhimImageUrl(m.thumb_url);
            m.poster_url = toOPhimImageUrl(m.poster_url);
        });

        itemsMain.forEach((m: any) => {
            if (!seenSlugs.has(m.slug)) {
                combined.push(m);
                seenSlugs.add(m.slug);
            }
        });

        itemsNguonc.forEach((m: any) => {
          if (!seenSlugs.has(m.slug)) {
            let thumb = m.thumb_url || m.poster_url;
            let poster = m.poster_url || m.thumb_url;
            if (thumb && !thumb.startsWith('http')) thumb = `${NGUONC_IMG_PREFIX}${thumb}`;
            if (poster && !poster.startsWith('http')) poster = `${NGUONC_IMG_PREFIX}${poster}`;
            combined.push({
              _id: m._id || m.slug,
              name: m.name,
              slug: m.slug,
              origin_name: m.origin_name || m.name,
              thumb_url: thumb,
              poster_url: poster,
              year: m.year,
              lang: m.language || m.lang,
              quality: m.quality
            });
            seenSlugs.add(m.slug);
          }
        });

        itemsVsmov.forEach((m: any) => {
          if (!seenSlugs.has(m.slug)) {
            combined.push({
              _id: m._id || m.slug,
              name: m.name,
              slug: m.slug,
              origin_name: m.origin_name || m.name,
              thumb_url: m.thumb_url || m.poster_url || '',
              poster_url: m.poster_url || m.thumb_url || '',
              year: m.year,
              lang: m.lang,
              quality: m.quality
            });
            seenSlugs.add(m.slug);
          }
        });

        return combined;
      } catch (e) { return []; }
    };

    let results = await fetchFromSources(keyword);
    
    // Stage 2: If no results found for full name (e.g. "Niki Chow Lai-Kei"), 
    // try searching with more recognizable parts of the name.
    if (results.length === 0) {
      const parts = keyword.trim().split(/\s+/);
      if (parts.length > 2) {
          // Try first 2 words (e.g. "Niki Chow")
          const shortKw = parts.slice(0, 2).join(' ');
          results = await fetchFromSources(shortKw);
      }
      
      // Stage 3: If still nothing and name has 3+ words, try first 3 words
      if (results.length === 0 && parts.length > 3) {
          const midKw = parts.slice(0, 3).join(' ');
          results = await fetchFromSources(midKw);
      }
    }
    
    return results;
  },

  searchMovies: async (keyword: string, limit = 24): Promise<ApiResponseSearch> => {
    return fetchJson(`${BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  }
};
