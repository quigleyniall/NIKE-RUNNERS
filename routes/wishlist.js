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
router.get("/basket", function (req,res){
  res.render("basket")
})
// mysql://bc8a9c5a9c040f:4949a292@us-cdbr-iron-east-05.cleardb.net/heroku_302d334300409a7?reconnect=true
// mysql://bc8a9c5a9c040f:4949a292@us-cdbr-iron-east-05.cleardb.net/heroku_302d334300409a7?reconnect=true
router.get("/wishlist",middleware.isLoggedIn, function(req,res){
  let q = "SELECT * FROM wishlist JOIN product ON product.id = wishlist.name_id JOIN details ON wishlist.name_id = details.name_id WHERE wishlist.color = details.color AND wishlist.user_id="+req.user.id+" GROUP BY details.color;"
  let w = " select sum(price) as total from (select * from wishlist JOIN product on wishlist.name_id = product.id WHERE wishlist.user_id="+req.user.id+") as list;"
  connection.query(q, function(err, result){
    if(err) throw err;
    connection.query(w, function(err, price){
      res.render("wishlist",{wishlist:result, price: price})
    })
  })
})

router.post("/products/:type/product-info/:id/:color/wishlist",middleware.isLoggedIn, function(req,res){
  let data = {
    name_id: req.params.id,
    user_id: req.user.id,
    color: req.params.color,
    size: req.body.size,
    detail_id: req.user.id
  }
  let q = "INSERT INTO wishlist SET ?"
  connection.query(q,data, function(err,result){
    if(err) throw err;
    req.flash('successful', 'Successfully added to your wishlist')
    res.redirect("/products/"+req.params.type+"/product-info/"+req.params.id+"/"+req.params.color)
  })
})
router.post("/products/:type/product-info/:id/:color/wishlist/delete",middleware.isLoggedIn, function(req,res){
 let q = "DELETE FROM wishlist WHERE user_id="+req.user.id+" AND color = '"+req.params.color+"' AND name_id="+req.params.id+";"
 console.log(req.params.id)
 connection.query(q, function(err, success){
   if(err) throw err;
   res.redirect("/wishlist")
 })
})

module.exports = router
