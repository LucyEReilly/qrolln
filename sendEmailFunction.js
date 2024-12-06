// Correct export of the sendEmail function
const nodemailer = require('nodemailer');
//const functions = require('@google-cloud/functions-framework');

// Configure email notification
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'attendance973@gmail.com',
        pass: 'dcnn qfdu mzau zsjx'
    }
});

exports.sendEmail = async (event, context) => {
    console.log('Event:', event);

    // Check for the presence of the data field 
    if (!event.data) { 
        console.error('No data in event:', event); 
        return; 
    } 
    
    // Extract and decode the Pub/Sub message 
    const base64Data = event.data.message 
        ? event.data.message.data : event.data; 
    
    const pubsubMessage = base64Data 
        ? JSON.parse(Buffer.from(base64Data, 'base64').toString()) : {};

    const mailOptions = {
        from: 'attendance973@gmail.com',
        to: pubsubMessage.email,
        subject: 'Attendance Confirmation',
        text: `Dear ${pubsubMessage.name},\n\nYour attendance for Week ${pubsubMessage.weekNumber} in Class ${pubsubMessage.classID} has been recorded.\n\nBest regards,\nAttendance System`
    };

    if (!pubsubMessage.email || !pubsubMessage.name) { 
        console.error('Invalid message:', pubsubMessage); 
        return; 
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', pubsubMessage.email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


// Register the function to handle Cloud Events
//functions.cloudEvent('sendEmail', sendEmail);

//module.exports = { sendEmail };