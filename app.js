const express = require("express");
const mysql = require("mysql2");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const app = express();
const { body, validationResult } = require("express-validator");
const requestIp = require("request-ip");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// APPLY COOKIE SESSION MIDDLEWARE
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000, // 1hr
  })
);
const dbCon = mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "edu_api",
  })
  .promise();

const ifNotLoggedin = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.send("login-register");
  }
  next();
};
const ifLoggedin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/home");
  }
  next();
};

// ROOT PAGE
app.get("/", ifNotLoggedin, (req, res, next) => {
  dbCon
    .execute("SELECT `username` FROM `admin_user` WHERE `id`=?", [
      req.session.userID,
    ])
    .then(([rows]) => {
      res.render("home", {
        name: rows[0].name,
      });
    });
}); // END OF ROOT PAGE
// homepage route
app.get("/", (req, res) => {
  return res.send({
    error: false,
    message: "Welcome to RESTful CRUD API with Nodejs, Express, MYSQL",
    written_by: "Panyakorn",
    published_on: "https://Panyakorn.dev",
  });
});

app.get("/users", (req, res) => {
  dbCon.query("SELECT * FROM admin_user", (error, results, fields) => {
    if (error) throw error;

    let message = "";
    if (results === undefined || results.length == 0) {
      message = "Books table is empty";
    } else {
      message = "Successfully retrieved all books";
    }
    return res.send({ error: false, data: results, message: message });
  });
});

// REGISTER PAGE
app.post(
  "/register",
  ifLoggedin,
  // post data validation(using express-validator)
  [
    body("email", "Invalid email address!")
      .isEmail()
      .custom((value) => {
        return dbCon
          .execute("SELECT `email` FROM `admin_user` WHERE `email`=?", [value])
          .then(([rows]) => {
            if (rows.length > 0) {
              return Promise.reject("This E-mail already in use!");
            }
            return true;
          });
      }),
    body("username", "Username is Empty!").trim().not().isEmpty(),
    body("password", "The password must be of minimum length 6 characters")
      .trim()
      .isLength({ min: 6 }),
  ], // end of post data validation
  (req, res, next) => {
    const validation_result = validationResult(req);
    const clientIp = requestIp.getClientIp(req);
    const { username, password, email } = req.body;
    // IF validation_result HAS NO ERROR
    if (validation_result.isEmpty()) {
      // password encryption (using bcryptjs)
      bcrypt
        .hash(password, 12)
        .then((hash_pass) => {
          // INSERTING USER INTO DATABASE
          dbCon
            .execute(
              "INSERT INTO `admin_user`(`username`,`email`,`password`,`created_ip1`) VALUES(?,?,?,?)",
              [username, email, hash_pass, clientIp]
            )
            .then((result) => {
              res.send(
                "your account has been created successfully, Now you can Login"
              );
            })
            .catch((err) => {
              // THROW INSERTING USER ERROR'S
              if (err) throw err;
            });
        })
        .catch((err) => {
          // THROW HASING ERROR'S
          if (err) throw err;
        });
    } else {
      // COLLECT ALL THE VALIDATION ERRORS
      let allErrors = validation_result.errors.map((error) => {
        return error.msg;
      });
      // REDERING login-register PAGE WITH VALIDATION ERRORS
      res.status(201).json({
        register_error: allErrors,
        old_data: req.body,
      });
    }
  }
); // END OF REGISTER PAGE

// LOGIN PAGE
app.post(
  "/login",
  ifLoggedin,
  [
    body("email").custom((value) => {
      return dbCon
        .execute("SELECT email FROM admin_user WHERE email=?", [value])
        .then(([rows]) => {
          if (rows.length == 1) {
            return true;
          }
          return Promise.reject("Invalid Email Address!");
        });
    }),
    body("password", "password is empty!").trim().not().isEmpty(),
  ],
  (req, res) => {
    const validation_result = validationResult(req);
    const { password, email } = req.body;
    if (validation_result.isEmpty()) {
      dbCon
        .execute("SELECT * FROM `admin_user` WHERE `email`=?", [email])
        .then(([rows]) => {
          bcrypt
            .compare(password, rows[0].password)
            .then((compare_result) => {
              if (compare_result === true) {
                req.session.isLoggedIn = true;
                req.session.userID = rows[0].id;

                res.send("welcome to home");
              } else {
                req.send("Invalid Password!");
              }
            })
            .catch((err) => {
              if (err) throw err;
            });
        })
        .catch((err) => {
          if (err) throw err;
        });
    } else {
      let allErrors = validation_result.errors.map((error) => {
        return error.msg;
      });
      // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
      res.json(`login_error: ${allErrors}`);
    }
  }
);
// END OF LOGIN PAGE

module.exports = app;
