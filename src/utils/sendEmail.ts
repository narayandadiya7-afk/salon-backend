const nodemailer = require("nodemailer");


const sendMail = async (req: any, res: any) => {
  // Function to send email
  //const { to, subject, text } = req.body;

  // Create a transporter object using SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  try {
    // Send email
    let info = await transporter.sendMail(req);
    console.log("Email sent: " + info.response);
    //res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error(error);
    //res.status(500).send("Error sending email");
  }
};

export default sendMail;
