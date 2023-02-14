const userDao = require("../models/userDao");
const emailDao = require("../models/emailDao");

const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs").promises;
const moment = require("moment");

const sendTicket = async (userId) => {
  const user = await userDao.getUserById(userId);
  const email = user.email;
  const info = await emailDao.ticketInfo(email);

  const formatDateTime = (datetime) =>
    moment(datetime).format("YY-MM-DD HH:MM:SS");

  const replacements = {
    english_name: `${info.first_name + info.last_name}`,
    phone: `${info.mobile_number}`,
    departure_datetime: `${formatDateTime(info.departure_date)}`,
    departure_city: `${info.departure}`,
    arrival_datetime: `${formatDateTime(info.arrival_date)}`,
    arrival_city: `${info.arrival}`,
    flight_number: `${info.flight_number}`,
  };

  const filePath = path.join(__dirname, "../utils/tickets.html");
  const source = await fs.readFile(filePath, "utf-8");
  const template = handlebars.compile(source);
  const htmlToSend = template(replacements);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"JUSTWEAIR TEAM" <justweair@gmail.com>`,
    to: email,
    subject: "JUSTWEAIR TICKET",
    text: "Please check your information",
    html: htmlToSend,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log("Email sent: " + result.response);
  return result;
};

module.exports = {
  sendTicket,
};
