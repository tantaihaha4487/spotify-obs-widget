import { Router } from "express";

const router = Router();

router.get('/', function (req, res) {
  if (req.user) {
    res.render('index.html', { user: req.user });
  } else {
    res.render('index.html', { user: null });
  }
});

export default router;