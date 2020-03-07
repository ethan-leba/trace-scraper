var amqp = require('amqplib');

async function wrapRabbit(func) {
  amqp.connect('amqp://localhost').then(function(conn) {
    return conn.createChannel().then(function(ch) {
      var q = 'hello';

      var ok = ch.assertQueue(q, {durable: false});

      return ok.then(function(_qok) {
        // NB: `sentToQueue` and `publish` both return a boolean
        // indicating whether it's OK to send again straight away, or
        //TODO:  (when `false`) that you should wait for the event `'drain'`
        // to fire before writing again. We're just doing the one write,
        // so we'll ignore it.
		func(transmit(ch, q));
        commit();
        // ch.sendToQueue(q, Buffer.from(msg));
        return ch.close();
      });
    }).finally(function() { conn.close(); });
  }).catch(console.warn);

}

function commit() {
  // Notifies the receiver that the scraper has completed
}

function transmit(channel, queue) {
  // Sends the entry over RabbitMQ
  return (data) => {
      channel.sendToQueue(queue, JSON.stringify(data));
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
