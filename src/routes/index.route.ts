import { Router } from "express";

const router = Router();

router.get('/', function (req, res) {
  if (req.user) {
    res.render('index.ejs', { user: req.user });
  } else {
    res.render('index.ejs', { user: null });
  }
});

export default router;