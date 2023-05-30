'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      DateTime: {
        type: Sequelize.DATE
      },
      Venue: {
        type: Sequelize.STRING
      },
      Participants: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      no_of_players: {
        type: Sequelize.INTEGER
      },
      Sports_id: {
        type: Sequelize.INTEGER
      },
      session_valididty: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};