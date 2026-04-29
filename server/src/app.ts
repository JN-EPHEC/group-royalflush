import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { requestLogger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes.js";
import blackjackRoutes from "./routes/blackjack.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(requestLogger);

app.use("/", authRoutes);
app.use("/api/blackjack", blackjackRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
