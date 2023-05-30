'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Session.init({
    DateTime: DataTypes.DATE,
    Venue: DataTypes.STRING,
    Participants: DataTypes.ARRAY(DataTypes.STRING),
    no_of_players: DataTypes.INTEGER,
    Sports_id: DataTypes.INTEGER,
    session_valididty: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};