# Buddy Up
This project was completed as part of my Masters Project in Information Systems course.

It was developed using HTML, CSS and JavaScript. Node.js was used for the backend server-side development and mySQL was used for the creation and manipulation
of the database.

During the sign up process the user will be able to select university and course to filter who the user will be paired up with. They will then be able to talk to their “buddy” and hopefully help each other out with any issues that they have.

## Problem to be solved
The project focuses on the problems that many new, and even some existing students face when integrating into university life. This is often due to young adults moving to a new area on their own away from friends and family for the first time. This can lead to difficulties in settling in, a feeling of isolation, and potentially a negative impact on mental health and wellbeing. The project aims to provide a solution in the form of a web-based application that will provide what has been termed “study buddy” system. The idea behind this is to connect students together in a simple, non-threatening way, to help people who may also be struggling to make contacts and build friendships.

## Server Installation - Run Locally
1. Clone this repository
2. Open CMD or Terminal
2. cd into the cloned repository directory
3. Type 'npm install' (This will install all of the dependencies/packages needed)
4. type 'npm run dbinit' (this will initialise the database - make sure you have mySQL installed and running, XAMPP is a good tool for this)
5. Type 'npm run start' to start the server.
6. Navigate to 'http://localhost:5000/' to display the website.

## Main Feutures
+ About page.
+ Login.
+ Registration.
+ Allow users to match using an information form.
+ Match with only one other person (2 people per group).
+ Match by course type.
+ Message buddy.
+ Log out.

## How to Use
### Home page
This is the first page that will be displayed when the user opens the website.

![Home](https://user-images.githubusercontent.com/43879432/183256132-6a807de8-5fd0-4015-8e16-debc5cd870ff.jpg)

### Registration
Here you will be able to register an account and select which university you are studying at.

![Register](https://user-images.githubusercontent.com/43879432/183256158-b0d41046-594e-4dc3-8075-da409506d061.jpg)

### Login
Here you will be able to login to your account using your credentials.

![Login](https://user-images.githubusercontent.com/43879432/183256253-bf177cd4-97ed-458f-8217-b640c4d4bf1e.jpg)

### Forums page
Here you will be able to browse the forum which is only open for users at the same university. The user can post and reply to other posts.

![Forum](https://user-images.githubusercontent.com/43879432/183256298-350dbc87-7e5e-4aeb-aaa7-dd04310264ec.jpg)

![ForumReply](https://user-images.githubusercontent.com/43879432/183256311-2c8cbc3b-d5fd-462d-94aa-9efcfdb48218.jpg)

### Matching form
This is the matching form the user will be presented with when they match up with a buddy.

![MatchingForm](https://user-images.githubusercontent.com/43879432/183256346-6cf3e179-2bac-42bc-8979-f02f660defbf.jpg)

### Buddy page
This is the main page where the user can message, add notes, upload files and set important dates in the callender/reminders.

![BuddyPage](https://user-images.githubusercontent.com/43879432/183256411-cdd3b266-0ab6-4bef-a2e2-270e39685c05.jpg)


