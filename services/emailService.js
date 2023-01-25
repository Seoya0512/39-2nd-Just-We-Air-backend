const userDao = require("../models/userDao");
const emailDao = require("../models/emailDao");

const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

const sendTicket = async (userId) => {
  const user = await userDao.getUserById(userId);
  const email = user.email;

  const info = await emailDao.ticketInfo(email);

  const formatDepartureDate = moment(info.departure_date).format(
    "YY-MM-DD HH:MM:SS"
  );
  const formatArrivalDate = moment(info.arrival_date).format(
    "YY-MM-DD HH:MM:SS"
  );

  const filePath = path.join(__dirname, "../utils/tickets.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    english_name: `${info.first_name + info.last_name}`,
    phone: `${info.mobile_number}`,
    departure_datetime: `${formatDepartureDate}`,
    departure_city: `${info.departure}`,
    arrival_datetime: `${formatArrivalDate}`,
    arrival_city: `${info.arrival}`,
    flight_number: `${info.flight_number}`,
  };
  const htmlToSend = template(replacements);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.GMAIL_ID}`,
      pass: `${process.env.GMAIL_PASSWORD}`,
    },
  });

  const mailOptions = {
    from: `JUSTWEAIR TEAM <"justweair@gmail.com">`,
    to: email,
    subject: "JUSTWEAIR TICKET",
    text: "Please Check your information",
    html: htmlToSend,
  };

  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = {
  sendTicket,
};
