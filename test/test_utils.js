var amqp = require('amqplib');

module.exports = {
    consumeMessages: consumeMessages,
    mockScraper: mockScraper,
}

// Returns the messages that have been sent to the Q
async function consumeMessages() {
  result = [];
    amqp.connect('amqp://localhost').then(function(conn) {
      process.once('SIGINT', function() { conn.close(); });
      return conn.createChannel().then(function(ch) {

        var q = 'test_queue';
        var ok = ch.assertQueue(q);

        ok = ok.then(function(_qok) {
          return ch.consume(q, function(msg) {
            console.log(" [x] Received '%s'", msg.content.toString());
          }, {noAck: true});
        });

        return ok.then(function(_consumeOk) {
          console.log(' [*] Waiting for messages. To exit press CTRL+C');
        });
      });
    }).catch(console.warn);
  // return result;
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
