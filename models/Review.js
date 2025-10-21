// Import data types from Sequelize
import { DataTypes } from 'sequelize';
// Import configured Sequelize instance
import { sequelize } from '../config/db.js';
// importing user model
import User from './User.js';
// importing content model
import Content from './Content.js';

const Content = sequelize.define('Review', {
    // COLUMN 1: ID (primary key)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,          // this is the primary key
        autoIncrement: true        // automatically incremental
    },

    //COLUMN 2: comment
    comment: {
        type: DataTypes.STRING,
        allowNull: true
    }

    //COLUMN 3: status -- to be deleted
    status: {
        type: DataTypes.ENUM,
        values: ['watched', 'to_watch', 'watching'],
        allowNull: false
    }

    //COLUMN 4: User id
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,    // modello di riferimento
            key: 'id'       // chiave primaria del modello User
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    //COLUMN 5: User id
    contentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Content, // modello di riferimento
            key: 'id'       // chiave primaria del modello Content
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }

}

//options

// add Sequalize relations

export default Review;