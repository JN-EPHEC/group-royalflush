import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma.js";

async function start() {
  try {
    await prisma.$connect();
    console.log("DB connectée");
    app.listen(3000, () => console.log(" http://localhost:3000"));
  } catch (err) {
    console.error("Erreur démarrage :", err);
  }
}

start();
