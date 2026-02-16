import express from "express";
import sequelize from "./config/database";
import userRoutes from "./routes/userRoutes";
import "./models/User"; // IMPORTANT: charge le modèle
import path from 'path'

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname,"../public")));

// routes
app.use("/api/users", userRoutes);



async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connectée");

    await sequelize.sync();
    console.log("✅ DB synchronisée");

    app.listen(3000, () => console.log("🚀 http://localhost:3000"));
  } catch (err) {
    console.error("❌ Erreur démarrage :", err);
  }
}

start();
