import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import ensureAuthenticated, { AuthenticatedRequest } from '../middlewares/ensureAuthenticated';

const router = Router();

router.get('/', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.accessToken) {
        return res.redirect('/auth/login');
    }

    try {
        const response = await axios.get('http://127.0.0.1:8067/api/current-playing', {
            headers: {
                Authorization: `Bearer ${req.user.accessToken}`,
            },
        }
        );

        if (response.status === 200 && response.data) {
            res.render('player.html', { track: response.data });
        } else {
            res.render('player.html', { track: null });
        }
    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        res.render('player.html', { track: null, error: 'Could not fetch currently playing track.' });
    }
});

export default router;
