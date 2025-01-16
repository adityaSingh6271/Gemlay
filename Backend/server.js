import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import sharedSession from "express-socket.io-session";
import connectDB from "./config/db.js"; // Database connection
import passport from "passport";
import authRoutes from "./routes/auth.js"; // Authentication routes
import productRoutes from "./routes/products.js"; // Product routes

// Load environment variables
dotenv.config();

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Session Middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Attach session to Socket.IO
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api/products", productRoutes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  const user = socket.handshake.session?.passport?.user;

  if (user) {
    socket.user = user;
    console.log(`Authenticated user connected: ${user.displayName}`);
  } else {
    console.log("Unauthenticated user connected.");
  }

  // Add product to cart
  socket.on("addToCart", async (productId, callback) => {
    if (!socket.user) {
      return callback({ success: false, message: "Not authenticated" });
    }

    // Simulate adding the product to the user's cart in the database
    console.log(
      `Adding product ${productId} to cart for user ${socket.user.id}`
    );

    // Emit the cart updated event with the product ID
    io.emit("cartUpdated", { productId, userId: socket.user.id });

    callback({ success: true, message: "Added to cart!" });
  });

  // Add product to wishlist
  // Add product to wishlist
  socket.on("addToWishlist", async (productId, callback) => {
    if (!socket.user) {
      return callback({ success: false, message: "Not authenticated" });
    }

    // Simulate adding to wishlist (You would save this to a database here)
    console.log(
      `Adding product ${productId} to wishlist for user ${socket.user.id}`
    );

    // Emit the wishlist updated event with the product ID
    io.emit("wishlistUpdated", { productId, userId: socket.user.id });

    callback({ success: true, message: "Added to wishlist!" });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
