const { sendEmail } = require('./app');

// Prepare mock data
const mockData = {
    data: 'eyJuYW1lIjoiU2FsIiwiZW1haWwiOiJqc2w3OUBwaXR0LmVkdSIsImNsYXNzSUQiOiJDUzEwMSIsIndlZWtOdW1iZXIiOjUwMDAsInBlb3BsZVNvZnROdW1iZXIiOjY5OTcsInRpbWVzdGFtcCI6IjIwMjQtMTItMDZUMDU6MzY6NDcuNDk4WiIsIm1lc3NhZ2UiOiJBdHRlbmRhbmNlIGZvciBKb2UgaW4gV2VlayA1MDAwIG9mIENsYXNzIENTMTAxIGhhcyBiZWVuIGNvbmZpcm1lZC4ifQ==',
    messageId: '12826308663134011',
    attributes: {
        classID: 'soc0002',
        weekNumber: '1'
    }
};

// Simulate the CloudEvent object
const cloudEvent = {
    data: {
        message: mockData
    }
};

// Call the sendEmail function with the mock CloudEvent
sendEmail(cloudEvent)
    .then(() => console.log('Test completed successfully'))
    .catch((error) => console.error('Test failed', error));
