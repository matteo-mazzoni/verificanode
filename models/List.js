import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const List = sequelize.define("List", {
title: { type: DataTypes.STRING, allowNull: false },
description: { type: DataTypes.TEXT, allowNull: true },
//content of the list: array of movie objects
content: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
tmdbListId: { type: DataTypes.STRING, allowNull: true },

source: { type: DataTypes.ENUM('tmdb', 'custom'), allowNull: false, defaultValue: 'custom' }
});

/**
* Helper: crea una List importando i film da TMDB.
* - listId: id della lista TMDB (es. una list id pubblica)
* - apiKey: opzionale, se non passato usa process.env.TMDB_API_KEY
* Ritorna l'istanza creata.
*/
List.createFromTMDB = async function (listId, apiKey) {
    const key = apiKey || process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB API key missing. Set TMDB_API_KEY or pass apiKey');

// prova ad usare global.fetch (Node 18+). Se non presente, prova a importare node-fetch dinamicamente.
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
    try {
      //import dinamico
        const nf = await import('node-fetch');
        fetchImpl = nf.default;
    } catch (err) {
        // se l'import dinamico fallisce
        throw new Error('Failed to import node-fetch dynamically: ' + (err && err.message ? err.message : String(err)));
    }
}
const url = `https://api.themoviedb.org/3/list/${encodeURIComponent(listId)}?api_key=${encodeURIComponent(key)}&language=en-US`;
const resp = await fetchImpl(url);
if (!resp.ok) throw new Error(`Failed to fetch TMDB list: ${resp.status} ${resp.statusText}`);
const data = await resp.json();

// mappa gli items nei campi
const movies = (data.items || []).map(item => ({
    tmdb_id: item.id,
    title: item.title || item.name || null,
    overview: item.overview || null,
    poster_path: item.poster_path || null,
    release_date: item.release_date || item.first_air_date || null,
    raw: item // conserva l'oggetto originale per riferimento
}));

return await List.create({
    title: data.name || `TMDB List ${listId}`,
    description: data.description || null,
    content: movies,
    tmdbListId: String(listId),
    source: 'tmdb'
    });
};

/**
 * Helper: aggiorna una List esistente con tmdbListId a partire dall'API TMDB.
 * - listInstance: istanza di List già presente
 * - apiKey: opzionale
 * Ritorna l'istanza aggiornata.
 */
List.updateFromTMDB = async function (listInstance, apiKey) {
  if (!listInstance || !listInstance.tmdbListId) {
    throw new Error('provide a List instance with tmdbListId to update');
  }
  const newList = await List.createFromTMDB(listInstance.tmdbListId, apiKey);
  // aggiorna i campi rilevanti sull'istanza esistente
listInstance.title = newList.title;
listInstance.description = newList.description;
listInstance.content = newList.content;
listInstance.source = 'tmdb';
await listInstance.save();
return listInstance;
};

export default List;