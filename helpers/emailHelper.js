const TAG = "emailHelper";

const nodemailer = require("nodemailer");

const EmailConfig = require("../config/emailConfig");

const SENDER_EMAIL = "eximpedia@gmail.com";

const buildEmailAccountActivationTemplate = (data) => {
  let user_name = data.recipientEmail.substring(
    0,
    data.recipientEmail.lastIndexOf("@")
  );
  let name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
  let emailDesign = `
  <html>
  <head>
         <meta name="viewport" content="width=device-width">
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
         </head>
  <body>
  <div
      class="card"
      style="
        display: block;
        transition: 0.3s;
        width: auto;
        flex-direction: column;
        padding-top: 20px;
        padding-left: 24px;
        padding-right: 24px;
        padding-bottom: 20px;
        /* top: 50%; */
        /* left: 5%; */
        position: absolute;
        /* transform: translate(-50%, -50%); */
        margin: auto;
      "
    >
      <img
        height="54px"
        src="https://eximpedia-static.s3.ap-southeast-1.amazonaws.com/logo-dark-og1.png"
        alt="Eximpedia Logo"
        style="width: 200px; float: left"
      />
      <span>
        <div style="position: relative; top: 0px; padding: 10px 10px 0px ; margin: 47px 0px 23px; margin-left: -15px">
          <div class="msgbody" style="margin: 20px 0px; border: 2px solid lightblue; border-radius: 10px; padding: 30px; ">
            <label style="font-size: large"><span id="dear">Dear</span> ${name},</label>
            <br />
            <p>Thanks for joining Emimpedia</p>
            <p>To access your Eximpedia panel,You need to click on the button below to activate your email access and set your desired password.</p>
            <div style="display: grid; place-items: center">
            <a style="text-decoration: none;cursor: pointer; color: white" href="${data.activationUrl}" 
            >
              <button
                style="
                 cursor:pointer;
                  margin: auto auto 18px ;
                  color: #fff;
                  background-color: #007BFF;
                  border-color: #007BFF;
                  display: flex;
                  cursor: pointer;
                  font-weight: 400;
                  text-align: center;
                  -webkit-user-select: none;
                  -moz-user-select: none;
                  -ms-user-select: none;
                  user-select: none;
                  border: 1px solid transparent;
                  padding: 0.375rem 0.75rem;
                  line-height: 1.5;
                  border-radius: 0.25rem;
                  font-size: 1rem;
                  text-align: center;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
               Click to Activate your account and reset your password
              </button>
              </a>
            </div>
            <span>We hope to offer you a uniquely pleasant experience and we look forward to having you use our services regular </span>
            <span>We are here you assist you , please mail us at </span> <a href="mailto:support@eximpedia"  style="
          
            color: #005d91;" >support@eximpedia</a>
          </div>
        </div>
      </span>
      <div class="left" style="float: right; position: relative;top:13px;">
        <div style=" float: right;margin-right: 12px;">
          <span class="regards" style="line-height: 36px; float: right; font-size: 27px; color: #005D91">Warm Regards,</span>

          <div style="display: block">
          <span
            class="careClass"
            style="
              margin: 0px 5px;
              float: right;
              padding: 0px;
              display: block;
              font-size: larger;
              letter-spacing: 1px;
            "
            >Customer Care</span
          >
        </div>
        <span
          class="careClass"
          style="
            margin: 0px 5px;
            float: right;
            padding: 0px;
            display: block;
            font-size: larger;
            letter-spacing: 1px;
          "
          >Eximpedia</span
        >
        </div>
        </div>

    </div>
  </body>
  </html>
  `;

  return emailDesign;
};

const buildEmailAccountSubscriptionTemplate = (data) => {
  let user_name = data.recipientEmail.substring(
    0,
    data.recipientEmail.lastIndexOf("@")
  );
  let name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
  let emailDesign = `
  <html>
  <head>
         <meta name="viewport" content="width=device-width">
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
         </head>
  <body>
  <div
      class="card"
      style="
        display: block;
        transition: 0.3s;
        width: auto;
        flex-direction: column;
        padding-top: 20px;
        padding-left: 24px;
        padding-right: 24px;
        padding-bottom: 20px;
        /* top: 50%; */
        /* left: 5%; */
        position: absolute;
        /* transform: translate(-50%, -50%); */
        margin: auto;
      "
    >
      <img
        height="54px"
        src="https://eximpedia-static.s3.ap-southeast-1.amazonaws.com/logo-dark-og1.png"
        alt="Eximpedia Logo"
        style="width: 200px; float: left"
      />
      <span>
        <div style="position: relative; top: 0px; padding: 10px 10px 0px ; margin: 47px 0px 23px; margin-left: -15px">
          <div class="msgbody" style="margin: 20px 0px; border: 2px solid lightblue; border-radius: 10px; padding: 30px; ">
            <label style="font-size: large"><span id="dear">Dear</span> ${name},</label>
            <br />
            <p>Thanks for joining Emimpedia</p>
            <p>Voila! Custom Subscription has been added to account. Enjoy the benefits and keep coming back.</p>
            <div style="display: grid; place-items: center">
            <a style="text-decoration: none;cursor: pointer; color: white" href="${data.accountAccessUrl}" 
            >
              <button
                style="
                 cursor:pointer;
                  margin: auto auto 18px ;
                  color: #fff;
                  background-color: #007BFF;
                  border-color: #007BFF;
                  display: flex;
                  cursor: pointer;
                  font-weight: 400;
                  text-align: center;
                  -webkit-user-select: none;
                  -moz-user-select: none;
                  -ms-user-select: none;
                  user-select: none;
                  border: 1px solid transparent;
                  padding: 0.375rem 0.75rem;
                  line-height: 1.5;
                  border-radius: 0.25rem;
                  font-size: 1rem;
                  text-align: center;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
               Click to Activate your account and reset your password
              </button>
              </a>
            </div>
            <span>We hope to offer you a uniquely pleasant experience and we look forward to having you use our services regular </span>
            <span>We are here you assist you , please mail us at </span> <a href="mailto:support@eximpedia" style="
          
            color: #005d91;" >support@eximpedia</a>
          </div>
        </div>
      </span>
      <div class="left" style="float: right; position: relative;top:13px;">
        <div style=" float: right;margin-right: 12px;">
          <span class="regards" style="line-height: 36px; float: right; font-size: 27px; color: #005D91">Warm Regards,</span>

          <div style="display: block">
          <span
            class="careClass"
            style="
              margin: 0px 5px;
              float: right;
              padding: 0px;
              display: block;
              font-size: larger;
              letter-spacing: 1px;
            "
            >Customer Care</span
          >
        </div>
        <span
          class="careClass"
          style="
            margin: 0px 5px;
            float: right;
            padding: 0px;
            display: block;
            font-size: larger;
            letter-spacing: 1px;
          "
          >Eximpedia</span
        >
        </div>
        </div>

    </div>
  </body>
  </html>
  `;
  return emailDesign;
};

const buildEmailResetPasswordTemplate = (data) => {
 
  let user_name = data.recipientEmail.substring(
    0,
    data.recipientEmail.lastIndexOf("@")
  );
  let name = user_name.charAt(0).toUpperCase() + user_name.slice(1);
  let emailDesign = `
  <html>
  <head>
         <meta name="viewport" content="width=device-width">
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
         </head>
  <body>
  <div
      class="card"
      style="
        display: block;
        transition: 0.3s;
        width: auto;
        flex-direction: column;
        padding-top: 20px;
        padding-left: 24px;
        padding-right: 24px;
        padding-bottom: 20px;
        /* top: 50%; */
        /* left: 5%; */
        position: absolute;
        /* transform: translate(-50%, -50%); */
        margin: auto;
      "
    >
      <img
        height="54px"
        src="https://eximpedia-static.s3.ap-southeast-1.amazonaws.com/logo-dark-og1.png"
        alt="Eximpedia Logo"
        style="width: 200px; float: left"
      />
      <span>
        <div style="position: relative; top: 0px; padding: 10px 10px 0px ; margin: 47px 0px 23px; margin-left: -15px">
          <div class="msgbody" style="margin: 20px 0px; border: 2px solid lightblue; border-radius: 10px; padding: 30px; ">
            <label style="font-size: large"><span id="dear">Dear</span> ${name},</label>
            <br />
            <p>Thanks for joining Emimpedia</p>
            <p>To access your Eximpedia panel,You need to click on the button below to activate your email access and set your desired password.</p>
            <div style="display: grid; place-items: center">
            <a style="text-decoration: none;cursor: pointer; color: white" href="${data.activationUrl}" 
            >
              <button
                style="
                 cursor:pointer;
                  margin: auto auto 18px ;
                  color: #fff;
                  background-color: #007BFF;
                  border-color: #007BFF;
                  display: flex;
                  cursor: pointer;
                  font-weight: 400;
                  text-align: center;
                  -webkit-user-select: none;
                  -moz-user-select: none;
                  -ms-user-select: none;
                  user-select: none;
                  border: 1px solid transparent;
                  padding: 0.375rem 0.75rem;
                  line-height: 1.5;
                  border-radius: 0.25rem;
                  font-size: 1rem;
                  text-align: center;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
               Click to Activate your account and reset your password
              </button>
              </a>
            </div>
            <span>We hope to offer you a uniquely pleasant experience and we look forward to having you use our services regular </span>
            <span>We are here you assist you , please mail us at </span> <a href="mailto:support@eximpedia"  style="
            color: #005d91;" >support@eximpedia</a>
          </div>
        </div>
      </span>
      <div class="left" style="float: right; position: relative;top:13px;">
        <div style=" float: right;margin-right: 12px;">
          <span class="regards" style="line-height: 36px; float: right; font-size: 27px; color: #005D91">Warm Regards,</span>

          <div style="display: block">
          <span
            class="careClass"
            style="
              margin: 0px 5px;
              float: right;
              padding: 0px;
              display: block;
              font-size: larger;
              letter-spacing: 1px;
            "
            >Customer Care</span
          >
        </div>
        <span
          class="careClass"
          style="
            margin: 0px 5px;
            float: right;
            padding: 0px;
            display: block;
            font-size: larger;
            letter-spacing: 1px;
          "
          >Eximpedia</span
        >
        </div>
        </div>

    </div>
  </body>
  </html>
  `;
  return emailDesign;
};

const buildEmailShowRecommendationTemplate = (data) => {
  let emailDesign = `
  <html>
  <head>
         <meta name="viewport" content="width=device-width">
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
         </head>
  <body>
  <div
      class="card"
      style="
        display: block;
        transition: 0.3s;
        width: auto;
        flex-direction: column;
        padding-top: 20px;
        padding-left: 24px;
        padding-right: 24px;
        padding-bottom: 20px;
        /* top: 50%; */
        /* left: 5%; */
        position: absolute;
        /* transform: translate(-50%, -50%); */
        margin: auto;
      "
    >
      <img
        height="54px"
        src="https://eximpedia-static.s3.ap-southeast-1.amazonaws.com/logo-dark-og1.png"
        alt="Eximpedia Logo"
        style="width: 200px; float: left"
      />
      <span>
        <div style="position: relative; top: 0px; padding: 10px 10px 0px ; margin: 47px 0px 23px; margin-left: -15px">
          <div class="msgbody" style="margin: 20px 0px; border: 2px solid lightblue; border-radius: 10px; padding: 30px; ">
            <label style="font-size: large"><span id="dear">Dear</span> ${data.recipientName},</label>
            <br />
            
            <p>Thanks for joining Emimpedia</p>

            <p>
                There is an addition of ${data.count} new records which are similar to the records which you have marked as favorites.
            <p>

            </div>
            <span>We hope to offer you a uniquely pleasant experience and we look forward to having you use our services regular </span>
            <span>We are here you assist you , please mail us at </span> <a href="mailto:support@eximpedia" style="
            color: #005d91;" >support@eximpedia</a>
          </div>
        </div>
      </span>
      <div class="left" style="float: right; position: relative;top:13px;">
        <div style=" float: right;margin-right: 12px;">
          <span class="regards" style="line-height: 36px; float: right; font-size: 27px; color: #005D91">Warm Regards,</span>

          <div style="display: block">
          <span
            class="careClass"
            style="
              margin: 0px 5px;
              float: right;
              padding: 0px;
              display: block;
              font-size: larger;
              letter-spacing: 1px;
            "
            >Customer Care</span
          >
        </div>
        <span
          class="careClass"
          style="
            margin: 0px 5px;
            float: right;
            padding: 0px;
            display: block;
            font-size: larger;
            letter-spacing: 1px;
          "
          >Eximpedia</span
        >
        </div>
        </div>

    </div>
  </body>
  </html>
  `;
  return emailDesign;
};

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: EmailConfig.gmail.host,
  port: EmailConfig.gmail.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: EmailConfig.gmail.user,
    pass: EmailConfig.gmail.pass,
  },
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Email Server is ready to take our messages");
  }
});

const triggerEmail = async (data , cb) => {
  let options = {
    from: EmailConfig.gmail.user, // sender address
    to: data.recipientEmail, // list of receivers
    subject: data.subject, // Subject line
    text: "", // plain text body
    html: data.html, // html body
  };
  //console.log(options);
  // send mail with defined transport object
  try {
    const info = await transporter.sendMail(options);
    cb(null,info);
  } catch (e) {
    cb(e);
  }
};

const transporterSupport = nodemailer.createTransport({
  host: EmailConfig.supportGmail.host,
  port: EmailConfig.supportGmail.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: EmailConfig.supportGmail.user,
    pass: EmailConfig.supportGmail.pass,
  },
});

// verify connection configuration
transporterSupport.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Email Server is ready to take our messages");
  }
});


const triggerSupportEmail = async (data , cb) => {
  let options = {
    from: EmailConfig.supportGmail.user, // sender address
    to: data.recipientEmail, // list of receivers
    subject: data.subject, // Subject line
    text: "", // plain text body
    html: data.html, // html body
  };
  //console.log(options);
  // send mail with defined transport object
  try {
    const info = await transporterSupport.sendMail(options);
    cb(null,info);
  } catch (e) {
    cb(e);
  }
};

module.exports = {
  buildEmailAccountActivationTemplate,
  buildEmailAccountSubscriptionTemplate,
  buildEmailResetPasswordTemplate,
  triggerEmail,
  triggerSupportEmail,
  buildEmailShowRecommendationTemplate,
};
