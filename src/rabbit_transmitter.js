var amqp = require('amqplib');

module.exports = {
    wrapRabbit: wrapRabbit
}

async function wrapRabbit(scraper) {
  let connection = await amqp.connect('amqp://localhost').catch((err) => {
    console.log(`Failed to assert queue: ${err}`);
  });
  console.log("Connected to AMQP");
  let ch = await connection.createChannel();
  console.log("Connected to channel");
  let q = 'test_queue';

  await ch.assertQueue(q).catch((err) => {
    console.log(`Failed to assert queue: ${err}`);
  });
  console.log("Transmitter: Connected to queue");

  // NB: `sentToQueue` and `publish` both return a boolean
  // indicating whether it's OK to send again straight away, or
  //TODO:  (when `false`) that you should wait for the event `'drain'`
  // to fire before writing again. We're just doing the one write,
  // so we'll ignore it.
  const transmit = get_transmit_fn(ch, q);
  await scraper(transmit);
  await commit();
        // ch.sendToQueue(q, Buffer.from(msg));
  // await ch.close();
  await connection.close()
}

async function commit() {
  // Notifies the receiver that the scraper has completed
}

function get_transmit_fn(channel, queue) {
  // Sends the entry over RabbitMQ
  return async (data) => {
      console.log("Sending data: " + JSON.stringify(data));
      await channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  };
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
