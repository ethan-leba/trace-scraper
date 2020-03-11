var assert = require("assert");
var Promise = require("promise");

var test_utils = require("./test_utils");
var rabbit = require("../src/rabbit_transmitter");

describe("RabbitMQ", function() {
  describe("#wrapRabbit()", function() {
    it("can send and receive data properly", async function() {
      const testData = "hey, this is steve. call me back!";
      const expected = new Array(10).fill(testData);
      await rabbit.wrapRabbit(test_utils.mockScraper(testData));
      let result = await test_utils.consumeMessages();
      assert.deepStrictEqual(result, expected);
    }).timeout(5000);
  });
  describe("#runRabbitScraper()", function() {
    it("will format data properly for reception by the backend", async function() {
      const testData = { steve: 30, Johnson: 82 };
      const expected = [
        ...new Array(10).fill({ command: "add", args: testData }),
        {
          command: "commit",
          args: {}
        }
      ].map(JSON.stringify);
      await rabbit.runRabbitScraper(test_utils.mockScraper(testData));
      let result = await test_utils.consumeMessages();
      assert.deepStrictEqual(result, expected);
    }).timeout(5000);
  });
});
