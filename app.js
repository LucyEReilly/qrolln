const express = require('express');
const qr = require('qr-image');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');
const { listenForMessages } = require('./sendEmailFunction');

// Initialize Firestore
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });
// const db = admin.firestore();

// const app = express();
// app.use(express.urlencoded({ extended: true })); // For form submissions
// app.use(express.json()); // For JSON requests

// app.get('/', (req, res) => {
//   res.redirect('/generate_teacher_qr');
// });

// // Initialize Pub/Sub 
// const pubSubClient = new PubSub({
//     projectId: 'qrollin',
//     keyFilename: './serviceAccountKey.json',
// });
// const topicName = 'attendance-confirmation';

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function getServiceAccountKey() {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
        name: 'projects/qrollin/secrets/SERVICE_ACCOUNT_KEY/versions/latest',
    });
    const keyData = version.payload.data.toString('utf8');
    return JSON.parse(keyData);
}

// Initialize Firebase Admin SDK dynamically
(async () => {
    const serviceAccount = await getServiceAccountKey();
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase initialized with credentials from Secret Manager!");
})();

// Initialize Pub/Sub client dynamically
async function getPubSubClient() {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
        name: 'projects/<project-id>/secrets/SERVICE_ACCOUNT_KEY/versions/latest',
    });
    const keyData = version.payload.data.toString('utf8');
    return new PubSub({
        projectId: 'qrollin',
        credentials: JSON.parse(keyData),
    });
}

// const pubSubClient = await getPubSubClient();
let pubSubClient;

async function initializePubSubClient() {
    const pubSubClient = await getPubSubClient();
    // Additional initialization code if needed
}

//initializePubSubClient();

// Call initialization function at startup
initializePubSubClient().catch((error) => {
    console.error('Error initializing Pub/Sub client:', error);
});



// Function to convert fields according to schema
const convertToSchema = (data) => {
    return { 
        name: data.name,
        peopleSoftNumber: parseInt(data.peopleSoftNumber, 10),
        email: data.email,
        classID: data.classID,
        weekNumber: parseInt(data.weekNumber, 10),
        timestamp: data.timestamp || new Date().toISOString(),
        message: `Attendance for ${data.name} in Week ${data.weekNumber} of Class ${data.classID} has been confirmed.`    };
}

// Start listening for messages
listenForMessages();


// Route for Teachers to Generate QR Code
app.get('/generate_teacher_qr', (req, res) => {
    const html = `
        <html>
        <head>
            <title>Generate QR Code for Attendance</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: #F5F5F5; color: #003594; }
                h1 { text-align: center; color: #003594; }
                form { 
                    max-width: 400px; 
                    margin: auto; 
                    padding: 20px; 
                    border: 1px solid #003594; 
                    border-radius: 10px; 
                    background-color: #FFFFFF;
                }
                label { font-weight: bold; }
                input, button { 
                    display: block; 
                    width: 100%; 
                    margin-bottom: 10px; 
                    padding: 10px; 
                    border: 1px solid #CCC; 
                    border-radius: 5px; 
                }
                button { 
                    background-color: #003594; 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                }
                button:hover { background-color: #FFB81C; color: #003594; }
            </style>
        </head>
        <body>
            <h1>Generate QR Code for Attendance</h1>
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
       // const qrCode = qr.image(qrData, { type: 'png' });

        const qrCode = qr.imageSync(qrData, { type: 'png' }); // Generate QR code as a buffer
        const html = `
            <html>
            <head>
                <title>Generated QR Code</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #F5F5F5; color: #003594; }
                    h1 { text-align: center; color: #003594; }
                    .qr-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 30px;
                    }
                    img { border: 2px solid #FFB81C; padding: 10px; border-radius: 10px; }
                    button {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background-color: #003594;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    button:hover { background-color: #FFB81C; color: #003594; }
                </style>
            </head>
            <body>
                <h1>QR Code for Attendance</h1>
                <div class="qr-container">
                    <p>Class ID: ${classID}</p>
                    <p>Week Number: ${weekNumber}</p>
                    <img src="data:image/png;base64,${qrCode.toString('base64')}" alt="QR Code">
                    <button onclick="window.history.back()">Generate Another QR Code</button>
                </div>
            </body>
            </html>
        `;

        res.send(html);

      //  res.setHeader('Content-Type', 'image/png');
       // qrCode.pipe(res); CHECK
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
            <title>Attendance for ${classID} - Week ${weekNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: #F5F5F5; color: #003594; }
                h1 { text-align: center; color: #003594; }
                form { 
                    max-width: 400px; 
                    margin: auto; 
                    padding: 20px; 
                    border: 1px solid #003594; 
                    border-radius: 10px; 
                    background-color: #FFFFFF;
                }
                label { font-weight: bold; }
                input, button { 
                    display: block; 
                    width: 100%; 
                    margin-bottom: 10px; 
                    padding: 10px; 
                    border: 1px solid #CCC; 
                    border-radius: 5px; 
                }
                button { 
                    background-color: #003594; 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                }
                button:hover { background-color: #FFB81C; color: #003594; }
            </style>
        </head>
        <body>
            <h1>Attendance for Class ${classID} - Week ${weekNumber}</h1>
            <form method="POST" action="/submit_attendance">
                <input type="hidden" name="classID" value="${classID}">
                <input type="hidden" name="weekNumber" value="${weekNumber}">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
                <label for="peopleSoftNumber">PeopleSoft Number:</label>
                <input type="text" id="peopleSoftNumber" name="peopleSoftNumber" required>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
                <button type="submit">Submit Attendance</button>
            </form>
        </body>
        </html>
    `;
    res.send(html);
});

// Submit Attendance to Firestore
app.post('/submit_attendance', async (req, res) => {
    const { name, peopleSoftNumber, email, classID, weekNumber } = req.body;

    console.log(req.body); // Log the entire request body

    if (!name || !peopleSoftNumber || !email || !classID || !weekNumber) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Convert the fields according to the Avro schema 
        const schemaData = convertToSchema(req.body);

        // Reference the nested structure: attendance -> classID -> weekNumber -> studentID
        const docRef = db
            .collection('attendance')
            .doc(classID.toLowerCase())
            .collection(`week_${weekNumber}`)
            .doc(name);

        // Add or update the student's attendance record
        await docRef.set({
            name: schemaData.name,
            peopleSoftNumber: schemaData.peopleSoftNumber,
            email: schemaData.email,
            timestamp: new Date(),
        });

        // Create and publish the Pub/Sub message
        const dataBuffer = Buffer.from(JSON.stringify(schemaData));
        await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });

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
                <h1>Thank You, ${name}!</h1>
                <p>Your attendance for <b>Class ${classID}</b> - Week ${weekNumber} has been successfully recorded.</p>
                <div class="details">
                    <p><b>Name:</b> ${name}</p>
                    <p><b>PeopleSoft Number:</b> ${peopleSoftNumber}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Timestamp:</b> ${new Date().toLocaleString()}</p>
                </div>
                <button onclick="window.location.href='/'">Back to Home</button>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).send('Failed to record attendance.');
    }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
