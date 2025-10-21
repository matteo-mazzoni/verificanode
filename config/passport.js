import passport from 'passport';
import User from '../models/user.js';

(async () => {
	try {
		const pkg = await import('passport-jwt');
		const { Strategy: JwtStrategy, ExtractJwt } = pkg;

		const options = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET || 'your-secret-key' // Usa variabile d'ambiente in produzione
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
	} catch (err) {
		console.error('Dettagli errore:', err);
	}
})();

export { default } from 'passport';