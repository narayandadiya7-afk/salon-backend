const cors = require("cors");
import express from "express";
import routes from "./routes";
const passport = require("passport");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
import setupAssociations from "./models/associations";
import { sourcePlatformMiddleware } from "./middleware/sourcePlatformMiddleware";
const GoogleStrategy = require("passport-google-oauth20").Strategy;


const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Use the cors middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || true,
  credentials: true,
}));
// Middleware to parse JSON
app.use(express.json());

// Source platform identification middleware
app.use(sourcePlatformMiddleware);

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Use routes
app.use("/api", routes);

// Session middleware
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3005/api/auth/google/callback",
    },
    function (accessToken: any, refreshToken: any, profile: any, done: any) {
      // In a production app, you would want to save the profile info to the database here.
      return done(null, profile);
    }
  )
);

// Serialize user info into the session
passport.serializeUser((user: any, done: any) => {
  done(null, user);
});

// Deserialize user info from the session
passport.deserializeUser((obj: any, done: any) => {
  done(null, obj);
});

setupAssociations();

export default app;
