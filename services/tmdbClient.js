// services/tmdbClient.js
import axios from "axios";

/**
 * Client Axios per TMDb v3.
 * Richiede: process.env.TMDB_TOKEN (Bearer v4)
 */
function assertToken() {
  if (!process.env.TMDB_TOKEN) {
    throw new Error(
      "TMDB_TOKEN non impostato. Aggiungi il Bearer v4 al file .env (TMDB_TOKEN=...)"
    );
  }
}

export const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  // l'header Authorization viene aggiunto in un interceptor (vedi sotto)
});

tmdb.interceptors.request.use((config) => {
  assertToken();
  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
  };
  return config;
});

export const commonParams = () => ({
  language: process.env.TMDB_LANG || "it-IT",
  region: process.env.TMDB_REGION || "IT",
  include_adult: false,
});

/** Costruttore veloce URL immagini (usa CDN standard TMDb) */
export const imgUrl = (path, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

/** Estrae il trailer YouTube “migliore” (ufficiale se disponibile) */
export const pickTrailerUrl = (videos) => {
  const list = Array.isArray(videos) ? videos : [];
  const ytTrailers = list.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  if (!ytTrailers.length) return null;
  ytTrailers.sort((a, b) => (b.official === true) - (a.official === true));
  return `https://www.youtube.com/watch?v=${ytTrailers[0].key}`;
};
