import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.routes.js";
import { meRouter } from "./routes/me.routes.js";
import { listingsRouter } from "./routes/listings.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { favouritesRouter } from "./routes/favourites.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { offersRouter } from "./routes/offers.routes.js";
import { reviewsRouter } from "./routes/reviews.routes.js";
import { technicianRouter } from "./routes/technician.routes.js";
import { technicianReviewsRouter } from "./routes/technician.reviews.routes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/listings", listingsRouter);
app.use("/admin", adminRouter);
app.use("/favourites", favouritesRouter);
app.use("/chat", chatRouter);
app.use("/technician", technicianRouter);
app.use("/technician", technicianReviewsRouter);
app.use("/", offersRouter);
app.use("/", reviewsRouter);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
