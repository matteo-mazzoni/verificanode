// Import data types from Sequelize
import { DataTypes } from 'sequelize';
// Import configured Sequelize instance
import { sequelize } from '../config/db.js';
// importing user model
import User from './User.js';
// importing content model
import Content from './Content.js';

// Review model definition
const Review = sequelize.define('Review', {
    // COLUMN 1: ID (primary key)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // COLUMN 2: comment
    comment: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // COLUMN 3: User id
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    // COLUMN 4: Content id
    contentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Content,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
});

// =====================
// ASSOCIATIONS
// =====================

// A review belongs to a single user
Review.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });

// A review refers to a single content
Review.belongsTo(Content, { foreignKey: 'contentId' });
Content.hasMany(Review, { foreignKey: 'contentId' });

export default Review;
