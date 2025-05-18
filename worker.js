const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectRabbitMQ, getChannel } = require("./config/rabbitmq");
const Notification = require("./models/Notification");

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB connected in Worker");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
    process.exit(1);
  }
}

async function startWorker() {
  await connectDB();
  await connectRabbitMQ();

  const channel = getChannel();

  channel.consume("notificationQueue", async (msg) => {
    if (msg !== null) {
      const { notificationId } = JSON.parse(msg.content.toString());

      try {
        const notification = await Notification.findById(notificationId);
        if (!notification) throw new Error("Notification not found");

        console.log(
          `Sending ${notification.type} notification to user ${notification.userId}: ${notification.message}`
        );

        const success = Math.random() > 0.2;

        if (success) {
          notification.status = "sent";
          await notification.save();
          channel.ack(msg);
        } else {
          notification.status = "failed";
          notification.retryCount = (notification.retryCount || 0) + 1;

          if (notification.retryCount < 3) {
            await notification.save();
            console.log(`Retrying notification ${notification._id} attempt ${notification.retryCount}`);

            setTimeout(() => {
              channel.sendToQueue("notificationQueue", Buffer.from(JSON.stringify({ notificationId })), {
                persistent: true,
              });
              channel.ack(msg);
            }, 5000);
          } else {
            await notification.save();
            channel.ack(msg);
            console.log(`Failed notification ${notification._id} after 3 attempts`);
          }
        }
      } catch (err) {
        console.error("Worker error:", err);
        channel.nack(msg);
      }
    }
  });

  console.log(" Notification worker started and listening to queue");
}

startWorker();
