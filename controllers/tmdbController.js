// controllers/tmdbController.js
import { tmdb, commonParams, imgUrl, pickTrailerUrl } from "../services/tmdbClient.js";
import { upsertMediaFromDto } from "../services/media.service.js";

/** Mappa la risposta TMDb (movie/tv) → DTO dominio */
function mapTmdbToDto(type, data) {
  const dto = {
    id: data.id,
    mediaType: type, // "movie" | "tv"
    title: data.title || data.name,
    overview: data.overview || null,
    year: (data.release_date || data.first_air_date || "").slice(0, 4) || null,
    runtime: data.runtime || (Array.isArray(data.episode_run_time) ? data.episode_run_time[0] : null),
    genres: (data.genres || []).map((g) => g.name),
    rating: {
      vote_average: data.vote_average ?? null,
      vote_count: data.vote_count ?? null,
    },
    trailer: pickTrailerUrl(data?.videos?.results || []),
    poster: imgUrl(data.poster_path, "w500"),
    backdrop: imgUrl(data.backdrop_path, "w780"),
    images: (data.images?.backdrops || []).slice(0, 10).map((i) => imgUrl(i.file_path, "w780")),
    cast: (data.credits?.cast || []).slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      profile: imgUrl(p.profile_path, "w185"),
    })),
    externalIds: data.external_ids || {},
  };

  return dto;
}

/**
 * GET /api/tmdb/:type/:id
 * type = movie | tv
 * Recupera dettagli da TMDb, normalizza, salva/aggiorna Media, risponde con il record Media.
 */
export async function getDetails(req, res) {
  try {
    const { type, id } = req.params;
    if (!["movie", "tv"].includes(type)) {
      return res.status(400).json({ error: "type non valido (movie|tv)" });
    }
    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({ error: "id non valido" });
    }

    const { data } = await tmdb.get(`/${type}/${id}`, {
      params: {
        ...commonParams(),
        append_to_response: "credits,videos,images,external_ids,recommendations",
      },
    });

    const dto = mapTmdbToDto(type, data);
    const media = await upsertMediaFromDto(dto);
    return res.json(media);
  } catch (err) {
    // logging dettagliato utile in sviluppo
    const resp = err?.response;
    console.error("TMDb getDetails error:", resp?.status, resp?.data || err.message);
    return res
      .status(resp?.status === 404 ? 404 : 500)
      .json({ error: "Errore durante il recupero dettagli TMDb" });
  }
}

/**
 * GET /api/tmdb/search?q=...&type=movie|tv|multi&page=1
 * Ricerca rapida su TMDb (non salva nel DB).
 */
export async function search(req, res) {
  try {
    const { q, type = "multi", page = 1 } = req.query;
    if (!q) return res.status(400).json({ error: "Parametro q mancante" });

    const endpoint =
      type === "tv" ? "/search/tv" :
      type === "movie" ? "/search/movie" :
      "/search/multi";

    const { data } = await tmdb.get(endpoint, {
      params: { ...commonParams(), query: q, page },
    });

    const results = (data.results || []).map((r) => ({
      id: r.id,
      media_type: r.media_type || (r.title ? "movie" : "tv"),
      title: r.title || r.name,
      overview: r.overview || null,
      year: (r.release_date || r.first_air_date || "").slice(0, 4) || null,
      vote_average: r.vote_average ?? null,
      poster: imgUrl(r.poster_path, "w342"),
    }));

    return res.json({ page: data.page, total_pages: data.total_pages, results });
  } catch (err) {
    const resp = err?.response;
    console.error("TMDb search error:", resp?.status, resp?.data || err.message);
    return res
      .status(resp?.status === 404 ? 404 : 500)
      .json({ error: "Errore durante la ricerca TMDb" });
  }
}
