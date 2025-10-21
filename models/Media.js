// models/Media.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Media = sequelize.define(
  "Media",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    tmdbId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    mediaType: { type: DataTypes.ENUM("movie", "tv"), allowNull: false },

    title: { type: DataTypes.STRING(255), allowNull: false },
    overview: { type: DataTypes.TEXT, allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: true },
    runtime: { type: DataTypes.INTEGER, allowNull: true },

    genres: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

    voteAverage: { type: DataTypes.FLOAT, allowNull: true },
    voteCount: { type: DataTypes.INTEGER, allowNull: true },

    trailerUrl: { type: DataTypes.STRING(500), allowNull: true },
    posterUrl: { type: DataTypes.STRING(500), allowNull: true },
    backdropUrl: { type: DataTypes.STRING(500), allowNull: true },
    gallery: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

    cast: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

    externalIds: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },

    lastSyncedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "Media",
    timestamps: true,
    indexes: [
      { fields: ["tmdbId"] },
      { fields: ["mediaType"] },
      { fields: ["title"] },
    ],
  }
);

export default Media;
