const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Mount router at /notifications
app.use("/notifications", require("./routes/notificationRoutes"));

// Connect RabbitMQ then start server
connectRabbitMQ().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
});
