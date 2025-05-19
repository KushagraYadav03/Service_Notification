require("dotenv").config();
const mongoose = require("mongoose");
const amqp = require("amqplib");
const nodemailer = require("nodemailer");
const Notification = require("./models/notification");
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(userEmail, message) {
  try {
    const info = await transporter.sendMail({
      from: `"Notifier" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "New Notification",
      text: message,
    });
    console.log(` Email sent: ${info.messageId}`);
  } catch (err) {
    console.error(" Error sending email:", err);
  }
}

async function startWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    const queue = "notifications";
    await channel.assertQueue(queue, { durable: true });

    console.log("📥 Notification worker started and listening to queue");

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const notification = JSON.parse(msg.content.toString());
        console.log(`📨 Processing notification for user: ${notification.userId}`);

        try {
          if (notification.type === "email") {
            await sendEmail(notification.userId, notification.message);
          }
          await Notification.findOneAndUpdate(
            { _id: notification._id },
            { status: "sent" }
          );

          channel.ack(msg);
        } catch (err) {
          console.error(" Error processing notification:", err);
        }
      }
    });
  } catch (err) {
    console.error(" Worker error:", err);
  }
}

startWorker();
