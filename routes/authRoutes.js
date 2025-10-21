import express from 'express';
import { 
    showLogin, 
    showSignup, 
    signup, 
    login, 
    logout, 
    showPreLogin, 
    searchMovies,
    addToFavorites,
    getFavorites,
    removeFromFavorites
} from '../controllers/authController.js';

const router = express.Router();

router.get('/pre-login', showPreLogin);

router.get('/login', showLogin);
router.post('/login', login);

router.get('/signup', showSignup);
router.post('/signup', signup);

router.get('/logout', logout);

router.get('/search', searchMovies);

router.post('/favorites/add', addToFavorites);
router.get('/favorites', getFavorites);
router.delete('/favorites/remove/:movieId', removeFromFavorites);

export default router;
