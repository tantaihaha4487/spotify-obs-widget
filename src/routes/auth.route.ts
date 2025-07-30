import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";

const router = Router();

router.get('/login', function (req: Request, res: Response) {
  res.render('login.html', {user: req.user});
});

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
  passport.authenticate('spotify', {failureRedirect: '/login', session: false}),
  function (req: any, res) {
    res.redirect(`/api/banner?token=${req.user.token}`);
  }
);


export default router;