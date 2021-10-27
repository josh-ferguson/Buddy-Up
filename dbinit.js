"use strict"

const express = require("express");
const mysql = require("mysql");

const app = express();

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root'
});

connection.connect((e) => {
    if (e) {
        throw e;
    }
    else {
       console.log("Connection to database established..");
    }
});

//create database
connection.query("create database if not exists BuddyUp",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("database created...");
});

//select database
connection.query("use BuddyUp",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("database selected...");
});

//creates Forums table
connection.query("create table if not exists Forums(university varchar(50) primary key)",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Forums table created...");
});

//creates Users table
connection.query("create table if not exists Users(userID int primary key auto_increment, university varchar(50) not null, fName varchar(50) not null, lName varchar(50) not null, email varchar(100) not null unique, password varchar(100) not null, profilePic BLOB, course varchar(100), prefferedLang varchar(30), gender varchar(30), interestOne varchar(30), interestTwo varchar(30), interestThree varchar(30), matched varchar(5), FOREIGN KEY (university) REFERENCES Forums(university))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Users table created...");
});

//creates Posts table
connection.query("create table if not exists Posts(postID int primary key auto_increment, university varchar(50) not null, userID int not null, body varchar(2000) not null, createdAt datetime not null, FOREIGN KEY (university) REFERENCES Forums(university), FOREIGN KEY (userID) REFERENCES Users(userID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Posts table created...");
});

//creates Replies table
connection.query("create table if not exists Replies(replyID int primary key auto_increment, postID int not null, userID int not null, body varchar(2000) not null, createdAt datetime not null, FOREIGN KEY (postID) REFERENCES Posts(postID), FOREIGN KEY (userID) REFERENCES Users(userID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Replies table created...");
});

//creates Matches table
connection.query("create table if not exists Matches(matchID int primary key auto_increment, userID int not null, matchedWith int not null, FOREIGN KEY (userID) REFERENCES Users(userID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Matches table created...");
});

//creates Messages table
connection.query("create table if not exists Messages(messageID int primary key auto_increment, matchID int not null, sentBy int not null, body varchar(2000) not null, sentAt datetime not null, FOREIGN KEY (matchID) REFERENCES Matches(matchID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Messages table created...");
});

//creates Notes table
connection.query("create table if not exists Notes(noteID int primary key auto_increment, matchID int not null, body varchar(2000) not null, addedAt datetime not null, FOREIGN KEY (matchID) REFERENCES Matches(matchID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Notes table created...");
});

//creates Files table
connection.query("create table if not exists Files(fileID int primary key auto_increment, matchID int not null, fileName varchar(100) not null, fileType varchar(15) not null, originalFileName varchar(100) not null, addedAt datetime not null, FOREIGN KEY (matchID) REFERENCES Matches(matchID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Files table created...");
});

//creates Calendar table
connection.query("create table if not exists Calendar(calendarID int primary key auto_increment, matchID int not null, fullDate date not null, year int, month int, day int, quarter int, dayOfWeek int, body varchar(2000), FOREIGN KEY (matchID) REFERENCES Matches(matchID))",
function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Calendar table created...");
  process.exit();
});
