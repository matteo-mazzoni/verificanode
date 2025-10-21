import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/user.js';

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your-secret-key' // Usa una variabile d'ambiente in produzione
};

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
        const user = await User.findByPk(jwt_payload.id);
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

export { default } from 'passport';