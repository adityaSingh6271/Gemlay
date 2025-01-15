import express from "express";
import http from "http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";

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
  // Add Socket.IO specific configurations
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"], // Enable WebSocket with polling fallback
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_fallback_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

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
      // Here you would typically save the user to your database
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
      // Here you would typically save the user to your database
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

// Socket.io
io.on("connection", (socket) => {
  console.log("A user connected with ID:", socket.id);

  // Attach user data to socket if authenticated
  if (socket.request.session?.passport?.user) {
    socket.user = socket.request.session.passport.user;
    console.log(
      `Authenticated user connected: ${
        socket.user.displayName || socket.user.username
      }`
    );
  }

  // Handle cart operations
  socket.on("addToCart", async (productId, callback) => {
    try {
      // Verify user is authenticated
      if (!socket.user) {
        throw new Error("User not authenticated");
      }

      // Here you would typically update the user's cart in the database
      console.log(
        `Adding product ${productId} to cart for user ${socket.user.id}`
      );

      // Emit to all user's connected clients
      socket.emit("cartUpdated", {
        productId,
        action: "added",
        timestamp: new Date().toISOString(),
      });

      // Acknowledge successful operation
      if (callback) {
        callback({
          success: true,
          message: "Product added to cart successfully",
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  // Handle wishlist operations
  socket.on("addToWishlist", async (productId, callback) => {
    try {
      // Verify user is authenticated
      if (!socket.user) {
        throw new Error("User not authenticated");
      }

      // Here you would typically update the user's wishlist in the database
      console.log(
        `Adding product ${productId} to wishlist for user ${socket.user.id}`
      );

      // Emit to all user's connected clients
      socket.emit("wishlistUpdated", {
        productId,
        action: "added",
        timestamp: new Date().toISOString(),
      });

      // Acknowledge successful operation
      if (callback) {
        callback({
          success: true,
          message: "Product added to wishlist successfully",
        });
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// Error handling for the Socket.IO server
io.engine.on("connection_error", (err) => {
  console.error("Connection error:", err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
