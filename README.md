# qrolln

## Project Overview
Our final project took on the example of a QR code class attenedance mechanism. It is responsible for providing an instructor with the ability to generate a QR code to track a weeks attendance. Once students successfully scan the code and verify their identity, they will be added to the list of students for that week. Instructors will be able to see student name and ID.

### Source Files
- [Presentation](https://docs.google.com/presentation/d/1_PRAgUe_DOMUDW7prpTn9Iqwj6RE4P_EsosuSz-Z5WQ/edit?usp=sharing) <br>
- [Github](https://github.com/LucyEReilly/qrolln) <br>
- [Application](https://qr-attendance-app-111994251683.us-central1.run.app/generate_teacher_qr)

## 3 GCP Services
### Firestore
#### Attendance Data Storage: 
Stores student attendance records with a structured hierarchy of class ID and week number.
#### Real-Time Database:
Ensures data is saved securely and can be retrieved quickly for reporting.
#### Seamless Integration:
Works with the Node.js app to record attendance before triggering Pub/Sub for notifications.
### Cloud Run
#### Hosting the App:
Runs the Node.js application to handle QR code generation, form submissions, and attendance recording.
#### Public Access: 
Provides endpoints for teachers and students to access forms and generate QR codes.
#### Scalability: 
Automatically scales with user demand and reduces costs by scaling to zero when idle.
### Pub/Sub
#### Purpose
Stores all submitted attendance messages in a centralized Pub/Sub topic.
Provides students with confirmation that attendance has been successfully submitted.  


## Automation
Streamlines the process of building, pushing, and preparing the application for deployment on Google Cloud.
#### Authentication:
Uses Workload Identity Federation to securely authenticate with GCP.
#### Docker Configuration:
Configures a Docker file. Then builds and pushes the image through Docker Buildx.
#### Cloud Run Deployment:
Prepares the container for deployment on Google Cloud Run.
#### Outcome
A fully automated CI/CD pipeline that ensures the application is consistently built and ready for deployment.

## Architecture

<img width="670" alt="image" src="https://github.com/user-attachments/assets/c5b83627-f300-446b-9f0c-f77f131cca9c">
