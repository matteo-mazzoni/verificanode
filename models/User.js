import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  favorites: {
    type: DataTypes.JSON,
    defaultValue: []
}
});

export default User;

