import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import Media from "../models/Media.js";
dotenv.config();
sequelize.models.Media = Media;

export const sequelize = new Sequelize('java', 'root', process.env.DATABASEPSSWD, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

export const connectDB = async () => {
try {
    await sequelize.authenticate();
    console.log('Connessione al DB riuscita');
} catch (error) {
    console.error('Impossibile connettersi al DB:', error);
}
};
