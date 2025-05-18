const Notification = require("../models/Notification");

exports.createNotification = async ({ userId, type, message }) => {
  const notification = new Notification({ userId, type, message });
  await notification.save();
  return notification;
};

exports.getNotificationsByUser = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 });
};

exports.updateStatus = async (id, status, retryCount = 0) => {
  return Notification.findByIdAndUpdate(id, { status, retryCount }, { new: true });
};
