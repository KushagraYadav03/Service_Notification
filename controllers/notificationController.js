const notificationService = require("../services/notificationService");
const queueService = require("../services/queueService");

exports.sendNotification = async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    if (!userId || !type || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const notification = await notificationService.createNotification({ userId, type, message });
    
    await queueService.sendToQueue("notificationQueue", { notificationId: notification._id });

    res.status(201).json({ message: "Notification queued", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notifications = await notificationService.getNotificationsByUser(userId);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
