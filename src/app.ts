import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import consolidate from "consolidate";
import nunjucks from "nunjucks";
import { Strategy as SpotifyStrategy, Profile, VerifyCallback } from "passport-spotify";
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import mongoose, { AnyArray } from 'mongoose';
import indexRouter from './routes/index.route';
import authRouter from './routes/auth.route';
import apiRouter from './routes/api.route';
import { User } from './models/user.model';

// Check for required environment variables at startup
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_REDIRECT_URI || !process.env.SESSION_SECRET || !process.env.MONGODB_URI) {
  console.error("FATAL ERROR: Missing required environment variables. Please ensure SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, and SESSION_SECRET are set in your .env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const port: number = Number(process.env.PORT) || 8067;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;
const SESSION_SECRET = process.env.SESSION_SECRET!;

// This interface extends the default Spotify profile to include access and refresh tokens.
interface UserProfile extends Profile {
  accessToken: string;
  refreshToken: string;
  token: string;
}

const app: Express = express();

app.set('views', __dirname + '/views');
nunjucks.configure(__dirname + '/views', { autoescape: true, express: app });
app.engine('html', consolidate.nunjucks);
app.set('view engine', 'html');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
      }
    next();
});

// Handle error
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.status || 500
  res.status(statusCode)
  res.render('index.html', { error: err })
});

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json())

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj: any, done) {
  done(null, obj);
});


passport.use(
  new SpotifyStrategy(
    {
      clientID: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      callbackURL: SPOTIFY_REDIRECT_URI,
    },
    async (
      accessToken: string,
      refreshToken: string,
      expires_in: number,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        let user = await User.findOne({ spotifyId: profile.id });

        if (user) {
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          await user.save();
        } else {
          user = await User.create({
            spotifyId: profile.id,
            email: profile.emails?.[0].value,
            accessToken: accessToken,
            refreshToken: refreshToken
          });
        }

        const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        const userProfile: UserProfile = {
          ...profile,
          accessToken: accessToken,
          refreshToken: refreshToken,
          token: token
        };
        return done(null, userProfile);
      } catch (err: any) {
        return done(err);
      }
    }
  )
);

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!
}, (jwtPayload, done) => {
  return User.findById(jwtPayload.sub)
    .then(user => {
      return done(null, user);
    })
    .catch(err => {
      return done(err);
    });
}));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter)


app.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
