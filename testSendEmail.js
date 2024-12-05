const { sendEmail } = require('./sendEmailFunction'); // Import the sendEmail function

// Prepare mock data
const mockData = {
    name: 'Jane Doe',
    email: 'jsl79@pitt.edu',
    classID: 'CS101',
    weekNumber: '5',
    timestamp: new Date().toISOString(),
    message: 'Attendance for John Doe in Week 5 of Class CS101 has been confirmed.'
};

// Base64-encode the mock data
const base64Data = Buffer.from(JSON.stringify(mockData)).toString('base64');

// Simulate the Pub/Sub message
const testMessage = {
    data: base64Data
};

// Call the sendEmail function with the test message
sendEmail(testMessage, null);
