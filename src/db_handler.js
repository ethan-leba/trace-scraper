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
    const course_query = mysql.format(
      "INSERT IGNORE INTO course (name, shortname) VALUES (?, ? ?)",
      [data.course_name, data.subject, data.course_number]
    );
    // const professor_query = "";
    // const entry_query = "";

    connection.query(course_query, function(error, results) {
      if (error) throw error;
      console.log(results);
    });
  }
};
