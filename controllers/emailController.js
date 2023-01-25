const emailService = require("../services/emailService");
const { catchAsync } = require("../utils/error");

const sendTicket = catchAsync(async (req, res) => {
  const userId = req.user;

  await emailService.sendTicket(userId);

  return res.status(200).json({ message: "SENT_TICKET" });
});

module.exports = {
  sendTicket,
};
