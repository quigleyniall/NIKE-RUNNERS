let express = require("express"),
      app     = express(),
      bodyParser = require('body-parser'),
      mysql = require("mysql"),
      passport = require("passport"),
      localStrategy = require("passport-local").Strategy,
      CookieParser = require('cookie-parser'),
      morgan = require('morgan'),
      flash    = require('connect-flash');


require('./config/passport')(passport)
app.use(bodyParser.json());
app.use(CookieParser());
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"))

app.use(require("express-session")({
    secret: "Once again",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error1 = req.flash("signupMessage");
    res.locals.error = req.flash("loginMessage")
    res.locals.successful = req.flash("successful")
    next()
})

let db_config = {
  host     : process.env.HOST,
  user    : process.env.USER,
  password : process.env.PASSWORD,
  database : process.env.DATABASE
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();



let productRoutes = require("./routes/products.js");
    reviewRoutes = require("./routes/review.js");
    wishlistRoutes = require("./routes/wishlist.js");
app.use(productRoutes)
app.use(reviewRoutes)
app.use(wishlistRoutes)


require('./routes/authentication.js')(app, passport); // load our routes and pass in our app and fully configured passport
let port = process.env.PORT || 8080
app.listen(port,process.env.IP,function(req,res){
    console.log("Server Running")
})
