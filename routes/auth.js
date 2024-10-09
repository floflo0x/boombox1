const express = require("express");

const { body, validationResult } = require("express-validator");

const axios = require("axios");

const FormData = require("form-data");

const crypto = require("crypto");

const requestIp = require("request-ip");

const router = express.Router();

const baseUrl = "https://api.hiphopboombox.com/api/";
const baseUrl2 = "https://api.hiphopboombox.com/app/api/connection/query.php";

// const baseUrl = "https://mateys.xyz/boombox/api/";
// const baseUrl2 = "https://mateys.xyz/boombox/app/api/connection/query.php";

const selectUrl = (method, data = null) => {
  let config = {
    method: method,
    maxBodyLength: Infinity,
    url: baseUrl2,
    headers: {},
  };

  // console.log(method.toLowerCase());

  if (method.toLowerCase() === "post" && data) {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    config.data = formData;
    config.headers = { ...formData.getHeaders() }; // Set headers for form data
  }

  return config;
};

router.post("/language", async (req, res, next) => {
  const { lang } = req.body;

  res.cookie("lang", lang);

  req.session.lang = lang;

  // console.log(x);
  // console.log(req.session);

  const referer = req.headers.referer;

  return res.redirect(referer);
});

router.get("/login", async (req, res, next) => {
  try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    // console.log(req.ip);
    // console.log(req.headers['x-forwarded-for'], req.socket.remoteAddress);

    return res.render("login", {
      title: "Login",
      errorMessage: message,
      auth: false,
      lang: req.lang,
      oldInput: {
        email: "",
      },
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/register", async (req, res, next) => {
  try {
    let message = req.flash("error");
    // console.log(message);

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    return res.render("register", {
      title: "Register",
      auth: false,
      errorMessage: message,
      lang: req.lang,
      oldInput: {
        image: "",
        name: "",
        email: "",
      },
    });
  } catch (error) {
    console.log(error);
  }
});

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
  ],
  async (req, res, next) => {
    try {
      // console.log(req.body);

      const { email, password } = req.body;

      const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("login", {
          title: "Login",
          errorMessage: msg1,
          auth: false,
          lang: req.lang,
          oldInput: {
            email: email,
          },
        });
      } else {
        let data = new FormData();
        data.append("email", email);
        data.append("password", password);

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: baseUrl + "auth/login.php",
          headers: {
            ...data.getHeaders(),
          },
          data: data,
        };

        const response = await axios.request(config);

        // console.log(response.data.isSuccess);

        if (response.data.isSuccess) {
          const postData2 = {
            q1: `insert into hSession (email, isLoggedIn) values ('${email}', 'true')`,
          };
          const response2 = await axios.request(selectUrl("post", postData2));

          res.cookie("_prod_email", email);

          res.cookie("_prod_isLoggedIn", true);

          const sessionId = crypto.randomUUID();
          // req.session.sessionId = sessionId;
          res.cookie("_prod_sessionId", sessionId);

          const csrfToken = crypto.randomUUID();
          // req.session.prodToken = csrfToken;
          res.cookie("_prod_token", csrfToken);

          req.session.save(async (err) => {
            if (!err) {
              const postData3 = {
                q1: `UPDATE users set rem_token = '${csrfToken}' where email = '${email}'`,
              };
              const response3 = await axios.request(
                selectUrl("post", postData3)
              );

              return res.redirect("/");
            } else {
              console.log("session error...");
              req.flash("error", "Try again...");
              return res.redirect("/login");
            }
          });
        } else {
          console.log("login error...");
          req.flash("Invalid email and password... Try again...");
          return res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/login");
    }
  }
);

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid user name"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email Address required")
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid password"),
    body("cpassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  async (req, res, next) => {
    try {
      const { email, password, cpassword, name, image } = req.body;

      // console.log(req.body);

      const error = validationResult(req);

      if (!error.isEmpty()) {
        // console.log(error.array());
        let msg1 = error.array()[0].msg;

        return res.render("register", {
          title: "Register",
          errorMessage: msg1,
          auth: false,
          lang: req.lang,
          oldInput: {
            image: image,
            name: name,
            email: email,
          },
        });
      } else {
        const clientIp = requestIp.getClientIp(req);

        // console.log(clientIp);

        let data = JSON.stringify({
          email: email,
          password: password,
          name: name,
          image: image,
          ip_address: clientIp,
        });

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: baseUrl + "auth/register.php",
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        const response = await axios.request(config);
        // console.log(response.data);

        if (response.data.isSuccess == true && response.data.user_id != 0) {
          const postData2 = {
            q1: `insert into hSession (email, isLoggedIn) values ('${email}', 'true')`,
          };
          const response2 = await axios.request(selectUrl("post", postData2));

          res.cookie("_prod_email", email);

          res.cookie("_prod_isLoggedIn", true);

          const sessionId = crypto.randomUUID();
          // req.session.sessionId = sessionId;
          res.cookie("_prod_sessionId", sessionId);

          const csrfToken = crypto.randomUUID();
          // req.session.prodToken = csrfToken;
          res.cookie("_prod_token", csrfToken);

          req.session.save(async (err) => {
            if (!err) {
              const postData3 = {
                q1: `UPDATE users set rem_token = '${csrfToken}' where id = '${response.data.user_id}'`,
              };
              const response3 = await axios.request(
                selectUrl("post", postData3)
              );

              return res.redirect("/");
            } else {
              console.log("session error...");
              req.flash("error", "Try again...");
              return res.redirect("/register");
            }
          });
        } else {
          console.log("register error...");
          req.flash("error", "Try again...");
          return res.redirect("/register");
        }
      }
    } catch (error) {
      console.log(error);
      return res.redirect("/register");
    }
  }
);

router.get("/logout", async (req, res, next) => {
  const postData2 = {
    q1: `DELETE from hSession where email = '${req.session.name}'`,
  };
  const response2 = await axios.request(selectUrl("post", postData2));

  req.session.destroy((err) => {
    // console.log(err);
    res.clearCookie("_prod_isLoggedIn");
    res.clearCookie("_prod_email");
    res.clearCookie("_prod_sessionId");
    res.clearCookie("_prod_token");
    res.clearCookie("lang");
    // res.clearCookie("showModal");
    return res.redirect("/");
  });
});

module.exports = router;
