const nodemailer = require('nodemailer');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Pub/Sub client
// const pubSubClient = new PubSub({
//     projectId: 'qrollin',
//     keyFilename: './serviceAccountKey.json',
// });

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function getPubSubClient() {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
        name: 'projects/qrollin/secrets/SERVICE_ACCOUNT_KEY/versions/latest',
    });
    const keyData = version.payload.data.toString('utf8');
    return new PubSub({
        projectId: 'qrollin',
        credentials: JSON.parse(keyData),
    });
}

// Initialize Pub/Sub client
//const pubSubClient = await getPubSubClient();
let pubSubClient;
async function initializePubSubClient() {
    const pubSubClient = await getPubSubClient();
    // Additional initialization code if needed
}

initializePubSubClient();


const subscriptionName = 'attendance-confirmation-sub';

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'attendance973@gmail.com',
        pass: 'dcnn qfdu mzau zsjx',
    },
});

// Function to process and send email
const sendEmail = async (message) => {
    try {
        // Decode and parse message
        const decodedData = Buffer.from(message.data, 'base64').toString();
        const pubsubMessage = JSON.parse(decodedData);

        if (!pubsubMessage.email || !pubsubMessage.name) {
            console.error('Invalid message:', pubsubMessage);
            message.nack(); // Retry
            return;
        }

        // Prepare email
        const mailOptions = {
            from: 'attendance973@gmail.com',
            to: pubsubMessage.email,
            subject: 'Attendance Confirmation',
            text: `Dear ${pubsubMessage.name},\n\nYour attendance for Week ${pubsubMessage.weekNumber} in Class ${pubsubMessage.classID} has been recorded.\n\nBest regards,\nAttendance System`,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${pubsubMessage.email}`);
        message.ack(); // Acknowledge message
    } catch (error) {
        console.error('Error sending email:', error);
        message.nack(); // Retry
    }
};

// Function to listen for Pub/Sub messages
exports.listenForMessages = () => {
    const subscription = pubSubClient.subscription(subscriptionName);

    subscription.on('message', sendEmail);
    subscription.on('error', (error) => {
        console.error('Subscription error:', error);
    });
};
