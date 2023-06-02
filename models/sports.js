'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sports.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static createSport({sportname,userId}){
      return this.create({
        sports_name: sportname,
        userId,
      })
    }

    static async getAllSports() {
      const allSports = await this.findAll();
      const uniqueSportSet = new Set();
      const uniqueSports = [];
    
      for (const sport of allSports) {
        const sportName = sport.sports_name;
    
        // Check if the sport name is already in the set
        if (!uniqueSportSet.has(sportName)) {
          uniqueSportSet.add(sportName);
          uniqueSports.push(sport);
        }
      }
    
      return uniqueSports;
    }
    

    static getSportByName(name){
      return this.findAll({
        where:{
          sports_name: name,
        }
      })
    }

    static getSportById(id){
      return this.findAll({
        where:{
          id,
        }
      })
    }


    static deleteSportById(id){
      return this.destroy({
        where:{
          id,
        }
      })
    }


    static editSport(name,oldname){
      return this.update({
        sports_name: name,
      },
      {
        where:{
          sports_name: oldname,
        }
      }
      )

    }
  }
  Sports.init({
    sports_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sports',
  });
  return Sports;
};