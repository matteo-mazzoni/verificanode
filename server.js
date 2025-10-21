// Import principali
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

// db and models
import { sequelize, connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// app setup
const app = express();
const PORT = process.env.PORT || 3000;

// express setup
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'supersecretkey', resave: false, saveUninitialized: false }));

// db connection and sync
await connectDB();
await sequelize.sync({ alter: true });
console.log('Tabelle sincronizzate');

// user middleware
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
}); 

// rotte principali
app.use('/', authRoutes);

// fallback 404
app.all('*', (req, res) => {
    res.status(404).send('<h2>Pagina non trovata</h2>');
});

// Avvio server
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}; per iniziare visita http://localhost:${PORT}/pre-login`);
});
