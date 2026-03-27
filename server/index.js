const express = require("express");
const cors = require("cors");
const { initWorld, getWorld, resetWorld } = require("./engine/world");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize world on server start
initWorld();

// GET /api/state — Return current world state
app.get("/api/state", (req, res) => {
  res.json(getWorld());
});

// POST /api/reset — Reset to initial state
app.post("/api/reset", (req, res) => {
  const world = resetWorld();
  res.json({ message: "World reset to initial state", world });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", turn: getWorld().config.turn });
});

app.listen(PORT, () => {
  console.log(`World Sim server running on http://localhost:${PORT}`);
});
