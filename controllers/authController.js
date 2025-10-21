import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import passport from 'passport';
import '../config/passport.js'; // esegue la configurazione della strategia JWT

export const showLogin = (req, res) => res.render('login');
export const showSignup = (req, res) => res.render('signup');

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

        req.session.save(err => {
            if (err) {
                console.error('Errore salvataggio sessione:', err);
                return res.status(500).send('Errore durante la creazione della sessione');
            }
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
