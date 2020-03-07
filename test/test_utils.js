var amqp = require('amqplib');

// Returns the messages that have been sent to the Q
function consumeMessages() {
  result = [];
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
        return ch.consume(q, function(msg) {
              if (msg !== null) {
                console.log(msg.content.toString());
                ch.ack(msg);
              }
            });
      });
    }).finally(function() { conn.close(); });
  }).catch(console.warn);
  return result;
}

// Send some stuff
async function mockScraper(transmit) {
    for(var i = 0; i < 10; i++) {

    }
}
