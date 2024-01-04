import nodemailer from 'nodemailer'


const config = () => {
    return {
        host: process.env.EMAIL_HOST || '',
        port: process.env.EMAIL_PORT || '',
        secure: true,
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL || '',
            pass: process.env.GMAIL_PASSWORD || '',
        }
    }
}

export const sendEmail = async (from: any, subject: string, to: string, template: any) => {
    // @ts-ignore
    let transporter = nodemailer.createTransport(config());
    const response = await transporter.sendMail({
        from, // sender address
        to, // list of receivers
        subject, // Subject line
        html: template, // html body
    })
    return response;
}