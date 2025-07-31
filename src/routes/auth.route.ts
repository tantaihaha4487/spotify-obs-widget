import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";

const router = Router();

router.get('/logout', function (req: Request, res: Response, next: NextFunction) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


router.get(
  '/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private', 'user-read-currently-playing']
  })
);


router.get(
  '/spotify/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('spotify', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        // Check for the specific TokenError
        if (err.name === 'TokenError') {
          console.warn('Invalid or expired authorization code. Redirecting to login.');
          // Redirect to the login page with an error message
          return res.redirect('/?error=invalid_auth_code');
        }
        // For other types of errors, pass them to the default error handler
        return next(err);
      }
      if (!user) {
        // This can happen if the user denies access on the Spotify consent screen
        return res.redirect('/');
      }

      // Authentication was successful.
      const fullUrl = `${req.protocol}://${req.get('host')}/api/widget?token=${user.token}`;
      res.render('index.html',{user: user, url: fullUrl});
    })(req, res, next);
  }
);


export default router;