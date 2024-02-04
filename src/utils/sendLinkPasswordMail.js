import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: "marigloria@gmail.com",
    pass: "xjrcbyzarjhlmnts",
  },
});

const sendLinkResetPassword = async (token, email) => {
  let result = await transporter.sendMail({
    from: "ecommerce Mari",
    to: email,
    subject: "Recuperar contraseña",
    
    html: `
      <h1>Recuperar contraseña</h1>
      <p>Para recuperar tu contraseña haz click en el siguiente link</p>
      <a href="http://localhost:8080/changepassword/${token}">Recuperar contraseña</a>
    `,
  });

  return result;
};

export { sendLinkResetPassword };