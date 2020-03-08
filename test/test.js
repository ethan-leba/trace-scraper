var assert = require('assert');
var Promise = require('promise');

var test_utils = require('./test_utils');
var rabbit = require('../src/rabbit_transmitter');

//describe('Testing the mocks', function() {
//    describe('#mockScraper()', function() {
//        it('calls the functions properly', async function() {
//            let x = 0;
//            const inc_x = async (y) => { x += 10; };
//            await (test_utils.mockScraper(10))(inc_x);
//            assert.equal(x, 100);
//        })
//    });
//});

describe('RabbitMQ', function() {
  describe('#wrapRabbit()', function() {
    it('will send the data without malformation', async function() {
      const testData = "hey, this is steve. call me back!";
      await rabbit.wrapRabbit(test_utils.mockScraper(testData));
      let result = await test_utils.consumeMessages();
      console.log(result);
      console.log(new Array(10).fill(testData));
      assert.deepStrictEqual(result, new Array(10).fill(testData));
    }).timeout(5000);
  });
});
