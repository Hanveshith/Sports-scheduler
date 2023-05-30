'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Session, {
        foreignKey: "userId",
      });
      User.hasMany(models.Sports, {
        foreignKey: "userId",
      });
    }

    static createuser({firstName,lastName,email,password,role}){
      return this.create({
        firstName,lastName,email,password,role
      })
    }

    static getUser(id){
      return this.findByPk(id);
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};