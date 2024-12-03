const express = require('express');
//const bodyParser = require('body-parser');
const qr = require('qr-image');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Firestore
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(express.json()); // For JSON requests

// Initialize Pub/Sub 
const pubsub = new PubSub({
    projectId: 'qrollin',
    keyFilename: './serviceAccountKey.json',
});
const subscriptionName = 'attendance-confirmation-sub';
const subscription = pubsub.subscription(subscriptionName);
const confirmations = []; // Array to store confirmation messages

subscription.on('message', (message) => {
    try {
        const messageData = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
        console.log(`Attendance confirmation received for ${messageData.name}`);

        // Add the confirmation message to the array
        confirmations.push({
            name: messageData.name,
            classID: messageData.classID,
            weekNumber: messageData.weekNumber,
            timestamp: messageData.timestamp,
        });

        message.ack(); // Acknowledge the message
    } catch (error) {
        console.error('Error processing notification:', error);
        message.nack(); // Retry message if there's an error
    }
});


// Route for Teachers to Generate QR Code
app.get('/generate_teacher_qr', (req, res) => {
    const html = `
        <html>
        <head>
            <title>Generate QR Code</title>
        </head>
        <body>
            <h1>Generate QR Code</h1>
            <form method="POST" action="/generate_qr">
                <label for="classID">Class ID:</label>
                <input type="text" id="classID" name="classID" required>
                <label for="weekNumber">Week Number:</label>
                <input type="number" id="weekNumber" name="weekNumber" required>
                <button type="submit">Generate QR Code</button>
            </form>
        </body>
        </html>
    `;
    res.send(html);
});

// Generate QR Code for Class and Week
app.post('/generate_qr', (req, res) => {
    const { classID, weekNumber } = req.body;

    if (!classID || !weekNumber) {
        return res.status(400).send('Class ID and Week Number are required.');
    }

    try {
        // Replace the local URL with the Cloud Run URL
        const cloudRunURL = 'https://qr-attendance-app-111994251683.us-central1.run.app';
        const qrData = `${cloudRunURL}/attendance?classID=${classID}&weekNumber=${weekNumber}`;
        const qrCode = qr.image(qrData, { type: 'png' });

        res.setHeader('Content-Type', 'image/png');
        qrCode.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Attendance Form for Students
app.get('/attendance', (req, res) => {
    const { classID, weekNumber } = req.query;

    if (!classID || !weekNumber) {
        return res.status(400).send('Invalid QR Code: Missing Class ID or Week Number.');
    }

    const html = `
        <html>
        <head>
            <title>Attendance</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                form { max-width: 400px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px; }
                label, input { display: block; margin-bottom: 10px; }
                button { padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Class Attendance</h1>
            <form method="POST" action="/submit_attendance">
                <input type="hidden" name="classID" value="${classID}">
                <input type="hidden" name="weekNumber" value="${weekNumber}">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
                <label for="peopleSoftNumber">PeopleSoft Number:</label>
                <input type="text" id="peopleSoftNumber" name="peopleSoftNumber" required>
                <button type="submit">Submit Attendance</button>
            </form>
        </body>
        </html>
    `;
    res.send(html);
});

// Submit Attendance to Firestore
app.post('/submit_attendance', async (req, res) => {
    const { name, peopleSoftNumber, classID, weekNumber } = req.body;

    if (!name || !peopleSoftNumber || !classID || !weekNumber) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Reference the nested structure: attendance -> classID -> weekNumber -> studentID
        const docRef = db
            .collection('attendance')
            .doc(classID)
            .collection(`week_${weekNumber}`)
            .doc(name);

        // Add or update the student's attendance record
        await docRef.set({
            name,
            peopleSoftNumber,
            timestamp: new Date(),
        });

        // Create the Pub/Sub message
        const messageData = {
            name,
            peopleSoftNumber,
            classID,
            weekNumber,
            timestamp: new Date().toISOString(),
        };
        const dataBuffer = Buffer.from(JSON.stringify(messageData));

        // Publish to the topic
        const topicName = 'attendance-confirmation';
        await pubsub.topic(topicName).publishMessage({ data: dataBuffer });

        res.send(`
            <html>
            <head>
                <title>Attendance Confirmed</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                    h1 { color: #28a745; }
                </style>
            </head>
            <body>
                <h1>Thank you, ${name}!</h1>
                <p>Your attendance for Week ${weekNumber} in Class ${classID} has been recorded.</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).send('Failed to record attendance.');
    }
});

app.get('/confirmations', (req, res) => {
    res.json(confirmations);
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});