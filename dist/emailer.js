"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class Email {
    constructor() {
        this.transporter = this.initTransporter();
    }
    send(options) {
        return new Promise((resolve, reject) => {
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
            console.log({ msg: 'Error while sending email!', e }, 'emails.json');
        });
    }
    initTransporter() {
        return nodemailer_1.default.createTransport({
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
exports.default = Email;
