import sequelize from "./config/database";
import "./models/User"; // IMPORTANT: charge le modèle
import app from "./app";


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
