const TAG = 'supportController';
const EnvConfig = require('../config/envConfig');

const EmailHelper = require('../helpers/emailHelper');
const NotificationModel = require('../models/notificationModel');



function raiseTicket(req, res) {
  try {
    let payload = req.body;
    const title = payload.title;
    const type = payload.type;
    const feedback = payload.feedback;
    const userEmail = payload.userEmail;

    let emailData = {
      recipientEmail: userEmail,
      subject: title,
      feedback: feedback
    }

    EmailHelper.triggerTicketEmail(emailData, async (error) => {
      if (error) {
        res.status(500).json({
          type: 'Something went wrong',
          msg: 'Error while sending mail',
        });
      } else {

        let emailTemplate = EmailHelper.buildUserNotificationTemplate();

        let notifyUserEmail = {
          recipientEmail: userEmail,
          subject: "Ticket Status",
          html: emailTemplate,
        }

        EmailHelper.triggerUserNotificationEmail(notifyUserEmail, async (error) => {
          if (error) {
            res.status(500).json({
              type: 'Something went wrong',
              msg: 'Error  while sending mail to user',
            });
          } else {
            res.status(200).json({
              msg: "Ticket Raised successfully"
            });
          }
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      type: 'Something went wrong',
      msg: 'Error while sending mail',
    });
  }

}

module.exports = {
  raiseTicket
}
