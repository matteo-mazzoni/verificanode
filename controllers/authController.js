import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

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
        if (!user) return res.status(401).json({ message: 'Utente non trovato' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Password errata' });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            'your-secret-key', // Usa una variabile d'ambiente in produzione
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante il login' });
    }
};

export const logout = (req, res) => {
    // Con JWT, il logout viene gestito lato client rimuovendo il token
    res.json({ message: 'Logout effettuato con successo' });
};

// Middleware per proteggere le rotte
export const authenticateJWT = passport.authenticate('jwt', { session: false });
