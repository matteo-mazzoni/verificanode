import passport from 'passport';
import User from '../models/user.js';

(async () => {
	// Try to dynamically import passport-jwt so missing package doesn't crash app at import time
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
		// If passport-jwt is missing, print a clear action message but don't crash the whole app
		/* eslint-disable no-console */
		console.error('\n[passport] Impossibile importare "passport-jwt". Per abilitare la strategia JWT eseguire:\n\n    npm install passport-jwt\n\nDopo l\'installazione riavvia l\'app.\n');
		/* eslint-enable no-console */
	}
})();

export default passport;