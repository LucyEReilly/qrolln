const nodemailer = require('nodemailer');

// Configure email notification
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'attendance973@gmail.com',
        pass: 'dcnn qfdu mzau zsjx'
    }
});

const sendEmail = async (req, res) => {
    const data = JSON.parse(Buffer.from(req.data, 'base64').toString());

    if (!req.data) {
        console.error('No data in message:', req);
        return;
    }

    const mailOptions = {
        from: 'attendance973@gmail.com',
        to: data.email,
        subject: 'Attendance Confirmation',
        text: `Dear ${data.name},\n\nYour attendance for Week ${data.weekNumber} in Class ${data.classID} has been recorded.\n\nBest regards,\nAttendance System`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', data.email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };