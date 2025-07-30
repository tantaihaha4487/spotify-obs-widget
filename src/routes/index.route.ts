import { Router } from "express";

const router = Router();

router.get('/', function (req, res) {
  res.render('index.html', {user: req.user});
});

export default router;