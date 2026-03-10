import express from "express";
import sequelize from "./config/database";
import userRoutes from "./routes/userRoutes";
import "./models/User"; // IMPORTANT: charge le modèle
import path from 'path'
import { requestLogger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import cors from 'cors';


const app = express();

app.use(cors()); // Autorise tout le monde (acceptable uniquement en dev)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

app.use(express.static(path.join(__dirname,"../public")));
app.use(requestLogger)

app.use("/api/users", userRoutes);  

app.use(errorHandler)

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB connectée");
    await sequelize.sync();
    console.log("DB synchronisée");

    app.listen(3000, () => console.log(" http://localhost:3000"));
  } catch (err) {
    console.error("❌ Erreur démarrage :", err);
  }
}

start();
