if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');

const cookieParser = require('cookie-parser');

const session = require('express-session');

const flash = require('connect-flash');

const axios = require('axios');

const FormData = require('form-data');

const authRoute = require("./routes/auth");

const userRoute = require("./routes/user");

const path = require("path");

const app = express();

const PORT = process.env.PORT || 5001;

app.set("view engine", "ejs");

app.set("views", "views");

app.set('trust proxy', true);

app.use(cookieParser());

app.use(session({
  secret: 'jefjwegj@!*&%^*%(1234#',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: "none", httpOnly: true },
}));

app.use(flash());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.cookies.lang = req.cookies.lang || 'en';
  req.session.name = req.cookies._prod_email || '';
  req.session.isLoggedIn = req.cookies._prod_isLoggedIn || 'false';
  req.session._prodSID = req.cookies._prod_sessionId || '';
  req.session._prodToken = req.cookies._prod_token || '';
  req.session.lang = req.cookies.lang || 'en';
  next();
});

app.use((req, res, next) => {
  const lang = req.session.lang;
  req.lang = require(`./languages/${lang}.json`);
  next();
});

app.use(async (req, res, next) => {
  // console.log(req.cookies, req.session.name, req.cookies._prod_email, req.cookies._prod_isLoggedIn);
  
  if (!req.session.name) {
    return next();
  }

  else {
    let data = new FormData();
    data.append('q2', `SELECT * FROM users where email = '${req.session.name}' limit 10 offset 0`);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.hiphopboombox.com/app/api/connection/query.php',
      headers: { 
        ...data.getHeaders()
      },
      data : data
    };

    const response = await axios.request(config);
    const data1 = response.data;

    if (data1.length >= 1) {
      req.user = data1[0];
      res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      return next();
    }
    else {
      req.flash("error", "Try again...");
      return res.redirect("/");
    }
  }
})

app.use(authRoute);

app.use(userRoute);

app.use('*', (req, res, next) => {
  return res.redirect("/login");
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
})