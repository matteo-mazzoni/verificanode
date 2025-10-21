// Import data types from Sequelize
import { DataTypes } from 'sequelize';
// Import configured Sequelize instance
import { sequelize } from '../config/db.js';

/**
 * Content model
 *
 * Rappresenta un film o una serie TV salvata dall'utente
 * dopo averlo cercato tramite l'API di TMDb
 */
const Content = sequelize.define('Content', {
    // COLONNA 1: ID (chiave primaria)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,          // Questa è la chiave primaria
        autoIncrement: true        // Si incrementa automaticamente
    },

    // COLONNA 2: ID su TMDb
    // Conserva l'ID originale del contenuto su TMDb
    // Serve per fare eventuali richieste future all'API
    tmdbId: {
        type: DataTypes.INTEGER,
        allowNull: false           // Campo obbligatorio
    },

    // COLONNA 3: Tipo di contenuto
    // Distingue se è un film o una serie TV
    type: {
        type: DataTypes.ENUM('movie', 'tv'),  // Solo questi 2 valori possibili
        allowNull: false                       // Campo obbligatorio
    },

    // COLONNA 4: Titolo
    title: {
        type: DataTypes.STRING,    // Testo breve (max 255 caratteri)
        allowNull: false           // Campo obbligatorio
    },

    // COLONNA 5: Trama/Descrizione
    // Usa TEXT perché le trame possono essere lunghe
    overview: {
        type: DataTypes.TEXT,      // Testo lungo (senza limiti)
        allowNull: true            // Campo opzionale
    },

    // COLONNA 6: Percorso Poster
    // Es: "/abc123.jpg" - fornito dall'API TMDb
    posterPath: {
        type: DataTypes.STRING,
        allowNull: true            // Campo opzionale (potrebbe non esserci immagine)
    },

    // COLONNA 7: Data di Uscita
    // Per film: data uscita cinema
    // Per serie: data prima puntata
    releaseDate: {
        type: DataTypes.DATEONLY,  // Solo data (YYYY-MM-DD), senza orario
        allowNull: true            // Campo opzionale
    },

    // COLONNA 8: Valutazione Media TMDb
    // Numero con 1 decimale, es: 8.5
    // DECIMAL(3,1) = max 3 cifre totali, 1 dopo la virgola (0.0 - 99.9)
    voteAverage: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true            // Campo opzionale
    },

    // COLONNA 9: ID Utente (Foreign Key)
    // Collega questo contenuto all'utente che l'ha salvato
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false           // Ogni contenuto DEVE appartenere a un utente
        // La relazione vera e propria sarà definita in models/index.js
    }
}, {
    // OPZIONI DEL MODELLO (terzo parametro)
    tableName: 'contents',         // Nome esplicito della tabella nel database
    timestamps: true               // Aggiunge automaticamente createdAt e updatedAt
});

// Export del modello per usarlo in altre parti dell'applicazione
export default Content;