import { Router, Request, Response } from "express";
import ensureAuthenticated from "../middlewares/ensureAuthenticated";

const router = Router();


router.get('/', ensureAuthenticated, (req, res) => {
  res.render('account.html', {user: req.user});
});

export default router;