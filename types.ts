
export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  time?: string;
  lang?: string;
  quality?: string;
  logo_url?: string; // Added to support cinematic logos
}

export interface Episode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface ServerData {
  server_name: string;
  server_data: Episode[];
}

export interface MovieDetail extends Movie {
  content: string;
  status: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  episode_current: string;
  episode_total: string;
  category: { id: string; name: string; slug: string }[];
  country: { id: string; name: string; slug: string }[];
  episodes: ServerData[];
  actor?: string[]; // Added actor field
}

export interface ApiResponseList<T> {
  status: boolean;
  items: T[];
  pathImage: string;
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface ApiResponseSearch {
  status: boolean;
  items: Movie[];
  pathImage: string;
  data: {
    items: Movie[];
    params: {
        pagination: {
            totalItems: number;
            totalItemsPerPage: number;
            currentPage: number;
            totalPages: number;
        }
    }
  }
}

export interface WatchHistoryItem {
  slug: string;
  name: string;
  poster_url: string;
  episodeSlug: string; // The slug of the last watched episode
  episodeName: string;
  timestamp: number; // Seconds watched
  lastUpdated: number; // Date.now()
  serverIndex: number; // The index of the last used server/audio source
}
