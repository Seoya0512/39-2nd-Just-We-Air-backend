const paymentDao = require("../models/paymentDao");
const axios = require("axios");
const { response } = require("express");

const savePayment = async (paymentKey) => {
  const options = {
    method: "GET",
    url: `https://api.tosspayments.com/v1/payments/${paymentKey}`,
    headers: {
      Authorization: `Basic ${process.env.SECRETKEY}`,
    },
  };

  const result = await axios.request(options).then(function (response) {
    return response.data;
  });

  const orderNumber = result.orderNumber;

  await paymentDao.updateOrderStatus(orderNumber);
};

module.exports = {
  savePayment,
};
