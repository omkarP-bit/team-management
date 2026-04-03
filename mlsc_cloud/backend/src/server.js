require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { PORT } = require("./config");
const credentialsRouter = require("./routes/credentials");

const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CORS_ORIGIN, methods: ["GET", "POST"] }));
app.use(express.json({ limit: "20kb" }));
app.use(morgan("tiny"));

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api", credentialsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
