import bcrypt from 'bcryptjs';
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
        if (!user) return res.send('Utente non trovato');

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send('Password errata');

        req.session.user = user;
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        res.send('Errore durante il login');
    }
};

export const logout = (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
};
