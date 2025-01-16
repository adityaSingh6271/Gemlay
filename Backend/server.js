import express from "express";
import http from "http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import sharedSession from "express-socket.io-session";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your_fallback_secret",
  resave: false,
  saveUninitialized: false,
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Attach session to Socket.IO
io.use(
  sharedSession(sessionMiddleware, {
    autoSave: true,
  })
);

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("http://localhost:3000/products")
);

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => res.redirect("http://localhost:3000/products")
);

app.get("/api/user", (req, res) => {
  res.json(req.user || null);
});

// Mock product data
const products = [
  { id: 1, name: "Product 1", price: 10 },
  { id: 2, name: "Product 2", price: 20 },
  { id: 3, name: "Product 3", price: 30 },
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

// Socket.IO events
io.on("connection", (socket) => {
  const user = socket.handshake.session?.passport?.user;

  if (user) {
    socket.user = user;
    console.log(
      `Authenticated user connected: ${user.displayName || user.username}`
    );
  } else {
    console.log("Unauthenticated user connected.");
  }

  socket.on("addToCart", (productId, callback) => {
    if (!socket.user) {
      return (
        callback &&
        callback({ success: false, error: "User not authenticated" })
      );
    }

    console.log(
      `Adding product ${productId} to cart for user ${socket.user.id}`
    );
    callback && callback({ success: true, message: "Added to cart!" });

    socket.emit("cartUpdated", productId);
  });

  socket.on("addToWishlist", (productId, callback) => {
    if (!socket.user) {
      return (
        callback &&
        callback({ success: false, error: "User not authenticated" })
      );
    }

    console.log(
      `Adding product ${productId} to wishlist for user ${socket.user.id}`
    );
    callback && callback({ success: true, message: "Added to wishlist!" });

    socket.emit("wishlistUpdated", productId);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
