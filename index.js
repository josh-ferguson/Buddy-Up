const express = require("express");
const path = require("path");
const session = require('express-session');
const ejs = require('ejs');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const uniqid = require("uniqid");
const FileStore = require("session-file-store")(session);
const store = require('express-session').store;
const BetterMemoryStore = require('session-memory-store')(session);
const multer = require("multer");

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use("/", express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/images", express.static(__dirname + "public/images"));
app.use("/uploads", express.static(__dirname + "public/uploads"));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(flash());

const sessionMiddleware = session({
    name: 'JSESSION',
    secret: 'MYSECRETISVERYSECRET',
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    store:  store,
    resave: true,
    saveUninitialized: true
})
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


// Local Database connection

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'BuddyUp'
});

connection.connect((e) => {
    if (e) {
        throw e;
    }
    else {
       console.log("Connection to database established..");
    }
});

//ClearDB connection

// const connection = mysql.createPool({
//   connectionLimit : 10,
//   host     : 'eu-cdbr-west-01.cleardb.com',
//   user     : 'b3740455f261d5',
//   password : '43130461',
//   database : 'heroku_d133c8604144373'
// });
//
// connection.getConnection((e) => {
//     if (e) {
//         throw e;
//     }
//     else {
//        console.log("Connection to database established..");
//     }
// });



//Upload File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/public/uploads")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadStorage = multer({ storage: storage })

//render pages

app.get('/', (req, res) => {
  res.render("index", {loggedIn: req.user})
});

app.get('/index', renderIndex);

app.get('/Register', (req, res) => {
  res.render("Register", {message :req.flash('registrationMemessage'), loggedIn: req.user})
});

app.get('/Login', (req, res) => {
  res.render("Login", { message: req.flash('message'), loggedIn: req.user })
});

app.get('/Forums', isAuthenticated, showPosts);

app.get('/Buddy', isAuthenticated, buddy);

app.get('/replies/:postId/', isAuthenticated, showReplies);

app.get("/BuddyMatched", isAuthenticated, buddyMatched);

app.get("/BuddyWaiting", (req, res) => {
  res.render("Buddy(waiting)", {loggedIn: req.user});
})


//Post requests
app.post("/register", register);

app.post("/login", passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/login',
    failureFlash: true
}), function(req, res, info){
    res.render('index',{'message' :req.flash('message')});
});

app.post("/postForm", addPost);

app.post("/replies/replyForm/:postId/", addReplies);

app.post("/match", match);

app.post("/sendMessage", sendMessage);

app.post("/addNote", addNote);

app.post("/uploadFile", uploadStorage.single("fileUploader"), uploadFile);

app.post("/addEvent", addEvent);

app.post("/logout", logout);

app.post("/createAnAcc", createAnAcc);

app.post("/unmatch", unmatch);




//Register
async function register(req, res) {
	let fName = req.body.fName;
	let lName = req.body.lName;
  let university = req.body.university;
	let email = req.body.email;
	let password = req.body.password;
	let confirmPassword = req.body.confirmPassword;


	if (password == confirmPassword) {

		connection.query('SELECT * FROM Users WHERE email = ?', [email], function(error, results, fields) {
			if (results.length > 0) {
				// "ER_Dup_ENTRY"
        req.flash('registrationMessage', 'This email already has an account saved!');
        res.render("Register", { message: req.flash('registrationMessage') })
				// res.send('This email already has an account saved');
			} else {

				connection.query('INSERT INTO Users(fName, lName, university, email, password) VALUES(?, ?, ?, ?, ?)', [fName, lName, university, email, password,], function(error, results, fields) {
					if (error) {
						throw error;
					}
					else {
						console.log("data added...");
						res.redirect("/index");
					}
				});

			}
		});

	} else {
    req.flash('registrationMessage', 'Passwords do not match');
    res.render("Register", { message: req.flash('registrationMessage') })
		// res.send('Passwords do not match');
	}
}

//Must be logged in to access
async function isAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  req.flash('message', 'You must be logged in to use this!')
  res.redirect('/login');
}

//Add Post to Database
async function addPost(req, res) {
  let userID = req.user.userID;
  let postText = req.body.postInput;
  connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
    let university = rows[0].university;
    console.log(university);
    connection.query('INSERT INTO Posts(university, userID, body, createdAt) VALUES(?, ?, ?, now())', [university, userID, postText], function(error, results, fields) {
      if (error) {
        throw error;
      }
      else {
        console.log("post added...");
        res.redirect("/Forums");
      }
    });
  });
}

//show forum results
async function showPosts(req, res) {

  const posts = [];

  let userID = req.user.userID;

  connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
    let university = rows[0].university;
    let usersName = [
      {
        fName: rows[0].fName,
        lName: rows[0].lName
      }
    ]

    connection.query('SELECT * FROM Posts WHERE university = ? ORDER BY createdAt ASC', [university], function(error, rows) {

      let length = rows.length

      for (let i = 0; i < length; i++) {
        let body = rows[i].body;
        let postID = rows[i].postID
        let link = "replies/"+postID.toString();

        connection.query('SELECT fName FROM Users WHERE UserID = ?', [rows[i].userID], function(error, rows) {
          let name = rows[0].fName;


          connection.query('SELECT count(replyID) AS replies FROM Replies WHERE postID = ?', [postID], function(error, rows) {
            let replies = rows[0].replies;


            posts.push({
              link: link,
              name: name,
              replies: replies,
              body: body
            });


            if (i === length - 1) {
              res.render("Forums", {posts: posts, loggedIn: req.user, usersName: usersName})
            }
          });
        });
      }
    });
  });
}

//Add replies to Database
async function addReplies(req, res) {
  let userID = req.user.userID;
  let replyText = req.body.replyInput;
  let postID = req.params.postId.toString();
  console.log(postID);
  connection.query('INSERT INTO Replies(postID, userID, body, createdAt) VALUES(?, ?, ?, now())', [postID, userID, replyText], function(error, results, fields) {
    if (error) {
      throw error;
    }
    else {
      console.log("reply added...");
      res.redirect("/Replies/"+postID.toString());
    }
  });

}

//show replies on replies page
async function showReplies(req, res) {

  let currentUserID = req.user.userID;
  connection.query('SELECT * FROM Users WHERE userID = ?', [currentUserID], function(error, rows) {
    let usersName = [
      {
        fName: rows[0].fName,
        lName: rows[0].lName
      }
    ]


    let params = req.params.postId;
    let passparams = {postID: "replyForm/"+ params.toString()}
    const comments = [];

    if (isNaN(params)) {
      res.redirect("/"+params);
    }else {

      connection.query('SELECT * FROM Posts WHERE postID = ?', [params], function(error, rows) {
        let userID = rows[0].userID;
        let body = rows[0].body;
        connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
          let name = rows[0].fName;
          let replyPost = {
            name: name,
            body: body
          }

          connection.query('SELECT * FROM Replies WHERE postID = ?', [params], function(error, rows) {

            let length = rows.length;

            if (length == 0) {
              let noReplies = {noReplies: 1};
              res.render("Replies", {passparams: passparams, replyPost: replyPost, noReplies: noReplies, loggedIn: req.user, usersName: usersName});
            }

            let noReplies = {noReplies: 0};

            for (let i = 0; i < length; i++) {
              let commentuserID = rows[i].userID;
              let commentbody = rows[i].body;

              connection.query('SELECT * FROM Users WHERE userID = ?', [commentuserID], function(error, rows) {
                let commentName = rows[0].fName;

                comments.push({
                  name: commentName,
                  body: commentbody
                });
                if (i === length - 1) {
                  res.render("Replies", {passparams: passparams, replyPost: replyPost, comments: comments, noReplies: noReplies, loggedIn: req.user, usersName: usersName});
                }

              });
            }
          });
        });
      });
    }
  });
}

//matching form - adding matching data to database and matching users
async function match(req, res) {
  let userID = req.user.userID
  let courseType = req.body.courseType;
  let prefferedLanguage = req.body.prefferedLanguage;
  let gender = req.body.gender;
  let interests = req.body.interests;
  let match = "";

  if (interests === undefined) {
    connection.query('UPDATE Users SET course = ?, prefferedLang = ?, gender = ?, matched = "no" WHERE userID = ?', [courseType, prefferedLanguage, gender, userID], function(error, rows) {
      if (error) {
        throw error;
      }
      else {
        connection.query('SELECT * FROM Users WHERE course = ? AND matched = "no"', [courseType], function(error, rows) {
          let match = "";
          if (rows.length == 1) {
            res.redirect("/BuddyMatched");
          }else {
            if (rows[0].userID == userID) {
              match = rows[1].userID;
            }else {
              match = rows[0].userID;
            }
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for current user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [userID, match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Users database for matched user
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for matched user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [match, userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            res.redirect("/BuddyMatched");

          }

        });
      }
    })
  }else if (typeof interests == "string") {
    connection.query('UPDATE Users SET course = ?, prefferedLang = ?, gender = ?, interestOne = ?, matched = "no" WHERE userID = ?', [courseType, prefferedLanguage, gender, interests, userID], function(error, rows) {
      if (error) {
        throw error;
      }
      else {
        connection.query('SELECT * FROM Users WHERE course = ? AND matched = "no"', [courseType], function(error, rows) {
          let match = "";
          if (rows.length == 1) {
            res.redirect("/BuddyMatched");
          }else {
            if (rows[0].userID == userID) {
              match = rows[1].userID;
            }else {
              match = rows[0].userID;
            }
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for current user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [userID, match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Users database for matched user
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for matched user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [match, userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            console.log("3 interests added added...");
            res.redirect("/BuddyMatched");

          }

        });
      }
    })
  }else if (interests.length > 3) {
    connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
      let usersName = [
        {
          fName: rows[0].fName,
          lName: rows[0].lName
        }
      ]
      req.flash('matchingMessage', 'You cannot select more than three interests!');
      res.render("Buddy(unmatched)", { message: req.flash('matchingMessage'), loggedIn: req.user, usersName: usersName})
    });
  }else if (interests.length == 2) {
    connection.query('UPDATE Users SET course = ?, prefferedLang = ?, gender = ?, interestOne = ?, interestTwo = ?, matched = "no" WHERE userID = ?', [courseType, prefferedLanguage, gender, interests[0], interests[1], userID], function(error, rows) {
      if (error) {
        throw error;
      }
      else {
        connection.query('SELECT * FROM Users WHERE course = ? AND matched = "no"', [courseType], function(error, rows) {
          let match = "";
          if (rows.length == 1) {
            res.redirect("/BuddyMatched");
          }else {
            if (rows[0].userID == userID) {
              match = rows[1].userID;
            }else {
              match = rows[0].userID;
            }
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for current user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [userID, match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Users database for matched user
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for matched user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [match, userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            console.log("3 interests added added...");
            res.redirect("/BuddyMatched");

          }

        });
      }
    })
  }else if (interests.length == 3) {
    connection.query('UPDATE Users SET course = ?, prefferedLang = ?, gender = ?, interestOne = ?, interestTwo = ?, interestThree = ?, matched = "no" WHERE userID = ?', [courseType, prefferedLanguage, gender, interests[0], interests[1], interests[2], userID], function(error, rows) {
      if (error) {
        throw error;
      }
      else {
        connection.query('SELECT * FROM Users WHERE course = ? AND matched = "no"', [courseType], function(error, rows) {
          let match = "";
          if (rows.length == 1) {
            res.redirect("/BuddyMatched");
          }else {
            if (rows[0].userID == userID) {
              match = rows[1].userID;
            }else {
              match = rows[0].userID;
            }
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for current user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [userID, match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Users database for matched user
            connection.query('UPDATE Users SET matched = "yes" WHERE userID = ?', [match], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            //update Matches database for matched user
            connection.query('INSERT INTO Matches(userID, matchedWith) VALUES(?, ?)', [match, userID], function(error, rows) {
              if (error) {
                throw error;
              }
            });
            console.log("3 interests added added...");
            res.redirect("/BuddyMatched");

          }

        });
      }
    })
  }
}

//Filled out matching form or not?
async function buddy(req, res) {
  let userID = req.user.userID;

  connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
    let usersName = [
      {
        fName: rows[0].fName,
        lName: rows[0].lName
      }
    ]
    if (rows[0].course === null) {
      res.render("Buddy(unmatched)", { message: req.flash('matchingMessage'), loggedIn: req.user, usersName: usersName})
    }else {
      res.redirect("/BuddyMatched");

    }
  });
}

//buddy page
async function buddyMatched(req, res) {
  let userID = req.user.userID;
  let matchedWith = "";
  let matchName = [];
  let messageData = [];
  let messageSentBy = "";
  let userMatchID = "";
  let matchesMatchID = "";
  let notesData = [];
  let notesDisplay = [];
  let fileData = [];
  let calendarData = [];
  let noMessages = {noMessages: 1};
  let noNotes = {noNotes: 1};
  let noFiles = {noFiles: 1};
  let noEvents = {noEvents: 1};

  connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
    let usersName = [
      {
        fName: rows[0].fName,
        lName: rows[0].lName
      }
    ]
    if (rows[0].matched == "no") {
      res.render("Buddy(waiting)", {loggedIn: req.user, usersName: usersName})
    }else {

      connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
        matchedWith = rows[0].matchedWith;
        userMatchID = rows[0].matchID;

        connection.query('SELECT * FROM Users WHERE userID = ?', [matchedWith], function(error, rows) {
          matchName.push({
            fName: rows[0].fName,
            lName: rows[0].lName,
            course: rows[0].course,
            gender: rows[0].gender,
            interestOne: rows[0].interestOne,
            interestTwo: rows[0].interestTwo,
            interestThree: rows[0].interestThree
          });

          connection.query('SELECT * FROM Messages WHERE sentBy = ? OR sentBy = ? ORDER BY sentAt DESC', [userID, matchedWith], function(error, rows) {
            if (rows.length == 0) {
              noMessages = {noMessages: 1};
            }else {
              noMessages = {noMessages: 0};

              for (let i = 0; i < rows.length; i++) {
                if (rows[i].sentBy == userID) {
                  messageSentBy = "user";
                }else {
                  messageSentBy = "match"
                }

                messageData.push({
                  messageBody: rows[i].body,
                  messageSentBy: messageSentBy
                })
              }
            }



                  connection.query('SELECT * FROM Matches WHERE userID = ?', [matchedWith], function(error, rows) {
                    matchesMatchID = rows[0].matchID;

                    connection.query('SELECT * FROM Notes WHERE matchID = ? OR matchID = ? ORDER BY addedAt ASC', [userMatchID, matchesMatchID], function(error, rows) {

                      if (rows.length == 0) {
                        noNotes = {noNotes: 1};
                      }else {
                        noNotes = {noNotes: 0};

                        for (let i = 0; i < rows.length; i+=2) {
                          if (rows[i+1] === undefined) {
                            notesData.push({
                              notesLeft: rows[i].body,
                              notesRight: 0
                            })
                            if (rows[1] === undefined) {
                              notesDisplay = [
                                {
                                  notesLeft: rows[0].body,
                                  notesRight: 0
                                }
                              ]
                            }
                          }else {
                            notesData.push({
                              notesLeft: rows[i].body,
                              notesRight: rows[i+1].body
                            })
                            notesDisplay = [
                              {
                                notesLeft: rows[0].body,
                                notesRight: rows[1].body
                              }
                            ]
                          }
                        }
                      }


                            connection.query('SELECT * FROM Files WHERE matchID = ? OR matchID = ? ORDER BY addedAt ASC', [userMatchID, matchesMatchID], function(error, rows) {
                              if (rows.length == 0) {
                                noFiles = {noFiles: 1};
                              }else {
                                noFiles = {noFiles: 0};

                                for (let i = 0; i < rows.length; i++) {
                                  fileData.push({
                                    fileName: "/uploads/" + rows[i].fileName,
                                    originalFileName: rows[i].originalFileName
                                  });
                                }
                              }


                                    connection.query('SELECT * FROM Calendar WHERE matchID = ? OR matchID = ? ORDER BY fullDate ASC', [userMatchID, matchesMatchID], function(error, rows) {
                                      if (rows.length == 0) {
                                        noEvents = {noEvents: 1};
                                      }else {
                                        noEvents = {noEvents: 0};

                                        for (let i = 0; i < rows.length; i++) {
                                          calendarData.push({
                                            fullDate: rows[i].fullDate,
                                            year: rows[i].year,
                                            month: rows[i].month,
                                            day: rows[i].day,
                                            body: rows[i].body
                                          })
                                        }
                                      }
                                        console.log(calendarData);
                                        res.render("Buddy(matched)", {matchName: matchName, noMessages: noMessages, messageData: messageData, noNotes: noNotes, notesData: notesData, noFiles: noFiles, fileData: fileData, noEvents: noEvents, calendarData: calendarData, loggedIn: req.user, usersName: usersName, notesDisplay: notesDisplay});

                                    });

                            });
                    });
                  });
          });
        });
      });
    }
  });
}

//Add messages to database
async function sendMessage(req, res) {
  let userID = req.user.userID;
  let messageValue = req.body.messageValue;

  connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
    let matchID = rows[0].matchID;

    connection.query('INSERT INTO Messages(matchID, sentBy, body, sentAt) VALUES(?, ?, ?, now())', [matchID, userID, messageValue], function(error, results, fields) {
      if (error) {
        throw error;
      }
      else {
        console.log("message data added...");
        res.redirect("/Buddy");
      }
    });
  });
}

//add notes to database
async function addNote(req, res) {
  let userID = req.user.userID;
  let noteValue = req.body.addNoteInput;

  connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
    let matchID = rows[0].matchID;

    connection.query('INSERT INTO Notes(matchID, body, addedAt) VALUES(?, ?, now())', [matchID, noteValue], function(error, results, fields) {
      if (error) {
        throw error;
      }
      else {
        console.log("note data added...");
        res.redirect("/Buddy");
      }
    });
  });
}

//adds file to files and adds to database
async function uploadFile(req, res) {
  let userID = req.user.userID;

  connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
    let matchID = rows[0].matchID;

    if (!req.file) {
      console.log("No file received");
      res.redirect('/Buddy');
    } else{
    	console.log('file received');
      connection.query('INSERT INTO Files(matchID, fileName, fileType, originalFileName, addedAt) VALUES (?, "'+ req.file.filename +'", "'+req.file.mimetype+'", "'+req.file.originalname+'", now())', [matchID], function(error, results, fields) {
  			if (error) {
  				throw error;
  			}else {
  				res.redirect('/Buddy');
  			}
  		});
  	}
  });
}

//adds events to database
async function addEvent(req, res) {
  let userID = req.user.userID;
  let datePicker = req.body.datePicker;
  let eventValue = req.body.eventValue
  let date = datePicker.toString();
  let year = datePicker.slice(0, 4);
  let month = datePicker.slice(5, 7);
  let day = datePicker.slice(8, 10);


  connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
    let matchID = rows[0].matchID;

    connection.query('INSERT INTO Calendar(matchID, fullDate, year, month, day, body) VALUES(?, ?, ?, ?, ?, ?)', [matchID, datePicker, year, month, day, eventValue], function(error, results, fields) {
      if (error) {
        throw error;
      }
      else {
        console.log("event data added...");
        res.redirect("/Buddy");
      }
    });
  });
}

//logout
async function logout(req, res){
  req.logout();
  res.redirect('/Login');
}

//redirect to Register
async function createAnAcc(req, res){
  res.redirect("/Register");
}

//render index
async function renderIndex(req, res){
  if (req.user != undefined) {
    let userID = req.user.userID
    connection.query('SELECT * FROM Users WHERE userID = ?', [userID], function(error, rows) {
      let usersName = [
        {
          fName: rows[0].fName,
          lName: rows[0].lName
        }
      ]
      res.render("index", {loggedIn: req.user, usersName: usersName});
    });
  }else {
    res.render("index", {loggedIn: req.user});
  }
}

//unmatch
async function unmatch(req, res){
  let userID = req.user.userID;

  connection.query('SELECT * FROM Matches WHERE userID = ?', [userID], function(error, rows) {
    let matchedWith = rows[0].matchedWith;
    let userMatchID = rows[0].matchID;

    connection.query('SELECT * FROM Matches WHERE userID = ?', [matchedWith], function(error, rows) {
      let matchesMatchID = rows[0].matchID;

      connection.query('DELETE FROM Messages WHERE matchID = ? OR matchID = ?', [userMatchID, matchesMatchID], function(error, rows) {});
      connection.query('DELETE FROM Notes WHERE matchID = ? OR matchID = ?', [userMatchID, matchesMatchID], function(error, rows) {});
      connection.query('DELETE FROM Files WHERE matchID = ? OR matchID = ?', [userMatchID, matchesMatchID], function(error, rows) {});
      connection.query('DELETE FROM Calendar WHERE matchID = ? OR matchID = ?', [userMatchID, matchesMatchID], function(error, rows) {});
      connection.query('DELETE FROM Matches WHERE matchID = ? OR matchID = ?', [userMatchID, matchesMatchID], function(error, rows) {});
      connection.query('UPDATE Users SET course = NULL, prefferedLang = NULL, gender = NULL, interestOne = NULL, interestTwo = NULL, interestThree = NULL, matched = NULL WHERE userID = ? OR userID = ?', [userID, matchedWith], function(error, rows) {
        if (error) {
          throw error;
        }
        res.redirect("/Buddy");
      });

    });
  });
}






//passport - Login
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true //passback entire req to call back
} , function (req, email, password, done){
      if(!email || !password ) { return done(null, false, req.flash('message','All fields are required.')); }
      connection.query("select userID, email, password from Users where email = ?", [email], function(err, rows){
          console.log(err); console.log(rows);
        if (err) return done(req.flash('message',err));
        if(!rows.length){ return done(null, false, req.flash('message','Invalid username or password.')); }
        let dbPassword  = rows[0].password;
        if(!(dbPassword == password)){
            return done(null, false, req.flash('message','Invalid username or password.'));
         }
        return done(null, rows[0]);
      });
    }
));

passport.serializeUser((user, done)=> {done(null, user); });

passport.deserializeUser((user, done)=>{done(null, user); });
