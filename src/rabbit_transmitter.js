var amqp = require("amqplib");

module.exports = {
  wrapRabbit: wrapRabbit,
  runRabbitScraper: runRabbitScraper
};

// Wraps a function with a RabbitMQ connection, allowing it to transmit messages
async function wrapRabbit(func) {
  let conn = await amqp.connect("amqp://localhost");
  let ch = await conn.createChannel();
  var q = "test_queue";

  await ch.assertQueue(q).then(async _qok => {
    // NB: `sentToQueue` and `publish` both return a boolean
    // indicating whether it's OK to send again straight away, or
    // (when `false`) that you should wait for the event `'drain'`
    // to fire before writing again. We're just doing the one write,
    // so we'll ignore it.
    const transmit = msg => {
      ch.sendToQueue(q, Buffer.from(msg));
      console.log(" [x] Sent '%s'", msg);
    };
    await func(transmit);
    return ch.close();
  });
  conn.close();
}

// Runs the scraper and transmits the information to Rabbit
async function runRabbitScraper(scraper) {
  wrapRabbit(async transmit => {
    const transmitJSON = json => {
      transmit(JSON.stringify(json));
    };
    await scraper(entry => {
      transmitJSON({ command: "add", args: entry });
    });
    transmitJSON({ command: "commit", args: {} });
  });
}

function formatJSON(data) {
  // Converts from "Last, First" to "First Last"
  let format_name = name => {
    const name_array = name.split(", ");
    return name_array[1] + " " + name_array[0];
  };

  // Escapes a string for CSV usage.
  let escape_string = str => `"${str}"`;

  // Applying the formatting
  data["name"] = format_name(data["name"]);
  data["course_name"] = escape_string(data["course_name"]);
}
