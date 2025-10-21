import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const List = sequelize.define("List", {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.List, allowNull: false}
});

export default List;