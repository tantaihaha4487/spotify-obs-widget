import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export default function ensureAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}