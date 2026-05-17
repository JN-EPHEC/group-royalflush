import "dotenv/config";
import { Sequelize } from "sequelize";

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    })
  : new Sequelize({
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME || "postgres",
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    });

export default sequelize;
