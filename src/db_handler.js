var mysql = require("mysql");

module.exports = {
  // Creates a connection to the mySQL server
  init: function() {
    return mysql.createConnection({
      host: "localhost",
      user: "ethan",
      password: "ethan",
      database: "courseload"
    });
  },

  // Inserts data into the DB
  insert: function(connection, data) {
    () => {
      data;
    };
    connection.query("SELECT 1 + 1 AS solution", function(error, results) {
      if (error) throw error;
      console.log("The solution is: ", results[0].solution);
    });
  }
};

//connection.connect();

//connection.end();
