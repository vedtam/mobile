import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export default class Email {
  transporter?: Mail;

  constructor() {
    this.transporter = this.initTransporter();
  }

  send(options: Mail.Options) {
    return new Promise<string | void>((resolve, reject) => {
      if (this.transporter) {
        this.transporter.sendMail(options, (e, info) => {
          if (e) {
            reject(e);
          }
          const msg_id = String(info.messageId);
          console.log('Message sent: ' + msg_id);
          resolve(msg_id);
        });
      }
    }).catch((e) => {
      console.log({msg: 'Error while sending email!', e}, 'emails.json');
    });
  }

  initTransporter() {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'vedtam@gmail.com',
        pass: 'idyjvusyhzydxlrx'
      }
    });
  }
}
