let express = require("express")
let router = express.Router({mergeParams: true })
let mysql = require("mysql")
let middleware = require("../middleware")

let db_config = {
  host     : process.env.HOST,
  user    : process.env.USER,
  password : process.env.PASSWORD,
  database : process.env.DATABASE
};


var connection;

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
router.get("/products/:type/product-info/:id/:color/review/new",middleware.isLoggedIn, function(req,res){
  let data = {
    type: req.params.type,
    id: req.params.id,
    color: req.params.color
  }
  res.render("new", {data: data})
})

router.post("/products/:type/product-info/:id/:color/review", function(req,res){
  let data = {
    review: req.body.review,
    user_id: req.user.id,
    name_id: req.params.id,
    summary: req.body.summary
  }
  let q = "INSERT INTO reviews SET ?"
  connection.query(q,data,function(err,results){
    if(err) throw err;
    res.redirect("/products/"+req.params.type+"/product-info/"+req.params.id+"/"+req.params.color)
  })
})

module.exports = router
