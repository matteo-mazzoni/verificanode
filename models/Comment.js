
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Comment = sequelize.define(
  "Comment",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, index: true },
    mediaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, index: true },

    // testo del commento
    text: { type: DataTypes.TEXT, allowNull: false },

    // rating opzionale sul singolo commento (puoi usarlo o ignorarlo)
    rating: { type: DataTypes.FLOAT, allowNull: true, validate: { min: 0, max: 10 } },
  },
  {
    tableName: "Comment",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["mediaId"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default Comment;
