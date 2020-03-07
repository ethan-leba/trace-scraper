var amqp = require('amqplib');

module.exports = {
    consumeMessages: consumeMessages,
    mockScraper: mockScraper,
}

// Returns the messages that have been sent to the Q
async function consumeMessages() {
  result = [];
  amqp.connect('amqp://localhost').then(function(conn) {
    return conn.createChannel().then(function(ch) {
      var q = 'test_queue';

      var ok = ch.assertQueue(q);
      console.log("Consumer: Connected to queue");

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
                result += msg;
              }
            });
      });
    }).finally(function() { conn.close(); });
  }).catch(console.warn);
  return result;
}

//let testData =

// Send some stuff
// TODO: Refactor name
function mockScraper(data) {
    return async (transmit) => {
        for(var i = 0; i < 10; i++) {
            await transmit(data);
        }
    }
}
