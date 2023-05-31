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
      Session.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }


    static createSession({datetime,venue,participants,no_of_players,sportid,sessionvalidity,userId}){
      return this.create({
        DateTime: datetime,
        Venue: venue,
        Participants: participants,
        no_of_players,
        Sports_id: sportid,
        session_valididty: sessionvalidity,
        userId,
      });
    }


    static editSession({datetime,venue,participants,no_of_players,id}){
      this.update({
        DateTime: datetime,
        Venue: venue,
        Participants: participants,
        no_of_players,
      },{
        where:{
          id,
        }
      })
      const updatedSession =  this.findOne({
        where: {
          id: id,
        },
      });
  
      return updatedSession;
    }


    static cancelSession({sessionvalidity,id}){
      return this.update({
        session_valididty: sessionvalidity,
      },{
        where:{
          id: id,
        }
      })
    }
    static getSession({sportId}){
      return this.findAll({
        where:{
          Sports_id: sportId,
          session_valididty: true
        },
      });
    }

    static deleteSessionBySportId({sportId}){
      return this.destroy({
        where:{
          Sports_id: sportId,
        }
      })
    }

    static joinSession({id,participants}){
      this.update({
        Participants: participants,
      },
      {
        where: {
          id: id,
        }
      })
      const updatedSession = this.findOne({
        where: {
          id: id,
        },
      });
  
      return updatedSession;
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