// Import principali
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import dotenv from 'dotenv';
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/db.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import Media from "./models/Media.js"; // importa i modelli almeno una volta all'avvio
// importa i modelli (registrazione su sequelize)
import User from "./models/User.js";
import Media from "./models/Media.js";
import UserMedia from "./models/UserMedia.js";
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

//aggancio tmbdRoutes dopo che il server è avviato
dotenv.config();
app.use(express.json());

await connectDB();
initModels();
await sequelize.sync({ alter: true });     // usa migration in prod

app.use("/api/tmdb", tmdbRoutes);

app.listen(PORT, () => console.log(`Server su http://localhost:${PORT}`));

//
dotenv.config();
//const app = express();
app.use(express.json());

// DB
await connectDB();
// registra i modelli sul connection scope
sequelize.models.Media = Media;
// crea/aggiorna tabelle in dev
await sequelize.sync({ alter: true });

// API
app.use("/api/tmdb", tmdbRoutes);

//const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server su http://localhost:${PORT}`));


// definisci associazioni
User.belongsToMany(Media, {
  through: UserMedia,
  foreignKey: "userId",
  otherKey: "mediaId",
  as: "library",
});
Media.belongsToMany(User, {
  through: UserMedia,
  foreignKey: "mediaId",
  otherKey: "userId",
  as: "followers",
});
UserMedia.belongsTo(User, { foreignKey: "userId" });
UserMedia.belongsTo(Media, { foreignKey: "mediaId" });
User.hasMany(UserMedia, { foreignKey: "userId" });
Media.hasMany(UserMedia, { foreignKey: "mediaId" });

// registra nel registry (opzionale se hai importato sopra)
sequelize.models.User = User;
sequelize.models.Media = Media;
sequelize.models.UserMedia = UserMedia;

// rotte
import tmdbRoutes from "./routes/tmdbRoutes.js";
import userMediaRoutes from "./routes/userMediaRoutes.js";

dotenv.config();
app.use(express.json());

await connectDB();
await sequelize.sync({ alter: true }); // dev only

app.use("/api/tmdb", tmdbRoutes);
app.use("/api/user-media", userMediaRoutes);


app.listen(PORT, () => console.log(`Server su http://localhost:${PORT}`));