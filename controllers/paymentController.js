const { catchAsync, raiseCustomError } = require("../utils/error");
const paymentService = require("../services/paymentService");

const savePayment = catchAsync(async (req, res) => {
  const paymentKey = req.body.paymentKey;

  await paymentService.savePayment(paymentKey);
  return res.status(200).json({ message: "SUCCESS" });
});

module.exports = { savePayment };
