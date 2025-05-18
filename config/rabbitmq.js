const amqp = require("amqplib");

let channel = null;

async function connectRabbitMQ() {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost";
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    await channel.assertQueue("notificationQueue", { durable: true });
    console.log(" RabbitMQ connected and queue created");
  } catch (err) {
    console.error(" RabbitMQ connection error:", err);
    process.exit(1);  
  }
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };
