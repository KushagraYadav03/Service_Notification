const { getChannel } = require("../config/rabbitmq");

exports.sendToQueue = (queueName, message) => {
  const channel = getChannel();
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
};
