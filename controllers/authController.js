import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import passport from 'passport';
import '../config/passport.js'; // esegue la configurazione della strategia JWT

export const showLogin = (req, res) => res.render('login');
export const showSignup = (req, res) => res.render('signup');
export const showPreLogin = (req, res) => {
    res.render('pre-login', {
        title: 'Welcome to Movies App',
        isLoggedIn: !!req.session.user
    });
};

export const signup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash });
    res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.send('Errore durante la registrazione');
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(401).send('Utente non trovato');

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).send('Password errata');

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // salva solo i dati minimi in sessione
        req.session.user = { id: user.id, username: user.username };
        req.session.token = token;

        // Assicurati che la sessione sia persistita prima di mostrare la dashboard
        req.session.save(err => {
            if (err) {
                console.error('Errore salvataggio sessione:', err);
                return res.status(500).send('Errore durante la creazione della sessione');
            }
            // Renderizza direttamente la dashboard per evitare "pagina non trovata"
            return res.render('dashboard', { username: user.username, token });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Errore durante il login');
    }
};

// nuova route per la dashboard
export const showDashboard = (req, res) => {
    const user = req.session.user;
    const token = req.session.token;
    if (!user || !token) return res.redirect('/login');
    return res.render('dashboard', { username: user.username, token });
};

export const logout = (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
};

// Middleware per proteggere le rotte
export const authenticateJWT = passport.authenticate('jwt', { session: false });

export const searchMovies = async (req, res) => {
    const query = req.query.q;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            error: 'TMDB_API_KEY non trovata nelle variabili ambiente' 
        });
    }

    if (!query) {
        return res.json({ movies: [] });
    }

    try {
        const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=it-IT`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        res.json({ movies: data.results || [] });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Errore durante la ricerca',
            details: error.message 
        });
    }
};

// Add a movie to favorites (session-first, try DB persist if User has 'favorites' field)
export const addToFavorites = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

        // Accept payload from JSON body or from query parameter 'movie' (encoded JSON)
        let movie = req.body && Object.keys(req.body).length ? req.body : null;
        if (!movie && req.query && req.query.movie) {
            try {
                movie = JSON.parse(decodeURIComponent(req.query.movie));
            } catch (err) {
                console.error('Error parsing movie payload from query:', err);
                return res.status(400).json({ error: 'Invalid movie payload in query' });
            }
        }

        // If movie was sent as a string in body (some middlewares), try to parse
        if (movie && typeof movie === 'string') {
            try {
                movie = JSON.parse(movie);
            } catch (err) {
                console.error('Error parsing movie payload from body:', err);
                return res.status(400).json({ error: 'Invalid movie payload' });
            }
        }

        if (!movie || !movie.id) return res.status(400).json({ error: 'Invalid movie payload' });

        req.session.favorites = req.session.favorites || [];
        const exists = req.session.favorites.find(m => String(m.id) === String(movie.id));
        if (!exists) req.session.favorites.push(movie);

        // Try to persist on DB user.favorites if model supports it
        try {
            const dbUser = await User.findByPk(sessionUser.id);
            if (dbUser) {
                const current = Array.isArray(dbUser.favorites) ? dbUser.favorites : [];
                if (!current.find(m => String(m.id) === String(movie.id))) {
                    current.push(movie);
                    if ('favorites' in dbUser) await dbUser.update({ favorites: current });
                }
            }
        } catch (dbErr) {
            console.warn('Unable to persist favorites to DB:', dbErr && dbErr.message ? dbErr.message : dbErr);
        }

        // Ensure session is saved
        await new Promise(resolve => req.session.save(resolve));
        return res.json({ success: true });
    } catch (error) {
        console.error('addToFavorites error:', error);
        return res.status(500).json({ error: 'Errore durante l\'aggiunta ai preferiti' });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser) return res.status(401).json([]);
        // prefer session cache
        if (Array.isArray(req.session.favorites)) return res.json(req.session.favorites);

        // fallback to DB
        try {
            const dbUser = await User.findByPk(sessionUser.id);
            return res.json(Array.isArray(dbUser?.favorites) ? dbUser.favorites : []);
        } catch (dbErr) {
            console.warn('Unable to read favorites from DB:', dbErr && dbErr.message ? dbErr.message : dbErr);
            return res.json([]);
        }
    } catch (error) {
        console.error('getFavorites error:', error);
        return res.status(500).json({ error: 'Errore nel recupero dei preferiti' });
    }
};

export const removeFromFavorites = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });
        const movieId = req.params.movieId;
        if (!movieId) return res.status(400).json({ error: 'movieId required' });

        req.session.favorites = (req.session.favorites || []).filter(m => String(m.id) !== String(movieId));

        try {
            const dbUser = await User.findByPk(sessionUser.id);
            if (dbUser && Array.isArray(dbUser.favorites)) {
                const updated = dbUser.favorites.filter(m => String(m.id) !== String(movieId));
                if ('favorites' in dbUser) await dbUser.update({ favorites: updated });
            }
        } catch (dbErr) {
            console.warn('Unable to persist removal to DB:', dbErr && dbErr.message ? dbErr.message : dbErr);
        }

        await new Promise(resolve => req.session.save(resolve));
        return res.json({ success: true });
    } catch (error) {
        console.error('removeFromFavorites error:', error);
        return res.status(500).json({ error: 'Errore durante la rimozione dai preferiti' });
    }
};

export const showFavorites = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser) return res.redirect('/login');

        let favorites = Array.isArray(req.session.favorites) ? req.session.favorites : [];

        if ((!favorites || favorites.length === 0)) {
            try {
                const dbUser = await User.findByPk(sessionUser.id);
                favorites = Array.isArray(dbUser?.favorites) ? dbUser.favorites : [];
            } catch (err) {
                console.warn('Cannot read favorites from DB:', err && err.message ? err.message : err);
                favorites = [];
            }
        }

        return res.render('favorites', { username: sessionUser.username, favorites });
    } catch (error) {
        console.error('showFavorites error:', error);
        return res.status(500).send('Errore durante il caricamento dei preferiti');
    }
};
