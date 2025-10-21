
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const UserMedia = sequelize.define(
  "UserMedia",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    // Relazioni (FK)
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    mediaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    // Stato personale (es. preferiti, guardati, ecc.)
    status: {
      type: DataTypes.ENUM("to_watch", "watching", "watched", "favorite"),
      allowNull: false,
      defaultValue: "to_watch",
    },

    // Rating e commenti personali
    personalRating: { type: DataTypes.FLOAT, allowNull: true, validate: { min: 0, max: 10 } },
    personalComment: { type: DataTypes.TEXT, allowNull: true },

    // Quando l’utente l’ha visto (opzionale)
    watchedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "UserMedia",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["mediaId"] },
      { fields: ["status"] },
      { unique: true, fields: ["userId", "mediaId"] }, // evita duplicati
    ],
  }
);

export default UserMedia;
