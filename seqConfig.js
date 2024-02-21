var Sequelize = require("sequelize");
Sequelize = new Sequelize("dircronjob", "username", "password", {
  host: "127.0.0.1",
  port: 3306,
  dialect: "mysql",
  insecureAuth: true,
  dialectOptions: {
    timeout: 3000,
  },
  logging: false,
});

module.exports.seqConfig = Sequelize;
