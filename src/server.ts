import express from "express";
import sequelize from "./config/database";
import User from "./models/User"; // IMPORTANT

const app = express();
app.use(express.json());

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion DB OK");

    await sequelize.sync({ force: true }); // temporaire pour recréer proprement
    console.log("✅ Tables synchronisées");

    app.listen(3000, () => {
      console.log("🚀 Serveur lancé sur http://localhost:3000");
    });

  } catch (error) {
    console.error("❌ Erreur :", error);
  }
}

startServer();
