import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/ensureAuthenticated";
import axios from "axios";
import passport from 'passport';

const router = Router();

router.get('/now-playing', passport.authenticate('jwt', { session: false }), async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.accessToken) {
        return res.redirect('/auth/spotify');
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${req.user.accessToken}`
            }
        });

        if (response.status === 200 && response.data) {
            res.json(response.data);
        } else {
            res.json(response.data || { error: 'No track currently playing' });
        }
    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        res.status(500).json({ error: 'Failed to fetch currently playing track' });
    }
});


router.get('/widget', (req: Request, res: Response) => {
    res.render('widget.ejs');
});


export default router;
