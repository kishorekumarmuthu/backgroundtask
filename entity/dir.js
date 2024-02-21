const Sequelize = require("sequelize");

var sequelize = require("../seqConfig").seqConfig;

const Dir = sequelize.define("dirtable", {
  seq_id: {
    // Sequelize module has INTEGER Data_Type.
    type: Sequelize.INTEGER,

    // To increment id automatically.
    autoIncrement: true,

    // id can not be null.
    allowNull: false,

    // For uniquely identify sequence.
    primaryKey: true,
  },

  magic_string_count: { type: Sequelize.INTEGER, allowNull: true },

  task_start_time: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },

  task_end_time: { type: Sequelize.DATE, allowNull: true },

  task_total_time: { type: Sequelize.STRING, allowNull: true },

  files_list: { type: Sequelize.STRING, allowNull: true },

  files_added_paths: { type: Sequelize.STRING, allowNull: true },

  files_deleted_paths: { type: Sequelize.STRING, allowNull: true },

  task_status: {
    type: Sequelize.ENUM("success", "failed", "in_progress"),
    defaultValue: "in_progress",
    allowNull: true,
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});

module.exports = Dir;
