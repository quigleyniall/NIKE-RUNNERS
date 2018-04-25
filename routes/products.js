let express = require("express")
let router = express.Router({mergeParams: true })
let mysql = require("mysql")

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


router.get("/", function(req,res){
  res.render("landing")
})
router.get("/products",function(req,res){
  // basic data
  let q = "SELECT name,price,color,image_url,type,name_id FROM product JOIN details ON product.id=details.name_id GROUP BY name_id;"
  // hover data
  let s = "SELECT name_id,color,image_url FROM details JOIN product WHERE details.name_id=product.id GROUP BY name_id, color;"
  // Number of colours
  let w = "SELECT name_id,COUNT(color) as num FROM (SELECT name_id,color FROM details JOIN product WHERE details.name_id=product.id GROUP BY name_id, color) as numofcolor GROUP BY name_id;"
  connection.query(q, function(error,results){
       if(error) throw error;
       connection.query(s, function(err, hoverdata){
         if(err) throw err
         connection.query(w, function(err,numofcolor){
           if(err) throw err
            res.render("products",{data: results, hoverdata:hoverdata, numofcolor:numofcolor});
         })
       })
   });
})

router.get("/products/color/:color", function(req,res){
  let color = req.params.color
  let q = "SELECT details.name_id,name,price,color,description,image_url,type FROM product JOIN description ON description.name_id = product.id JOIN details ON details.name_id = product.id WHERE color LIKE '%"+color+"%' GROUP BY color,details.name_id;"
  connection.query(q, function(err,data){
    if(err) throw err;
    let hoverdata=[];
    let numofcolor=[]
  res.render("products",{data: data, hoverdata: hoverdata, numofcolor: numofcolor})

  })
})

router.get("/products/:type/product-info/:id/:color", function(req,res){
  let id = req.params.id
  let color = req.params.color
  let q = "SELECT product.id as id,name,price,color,description,image_url,type FROM product JOIN description ON description.name_id = product.id JOIN details ON details.name_id = product.id WHERE product.id ="+id+" AND color ='"+color+"';"
  let s = "SELECT color,image_url FROM details WHERE details.name_id="+id+" GROUP BY color;"
  // Reviews
  let w = "SELECT DATE_FORMAT(created,'%d/%m/%Y at %h:%m') as created,review,username,summary FROM reviews JOIN users ON users.id = reviews.user_id JOIN product ON product.id = reviews.name_id WHERE product.id = "+id+";"
  connection.query(q, function(err, data){
    if(err) throw err;
    connection.query(s, function(err, moredata){
      if(err) throw err;
      connection.query(w, function(err, reviewdata){
        if(err) throw err;
          res.render("product-info", {data: data, moredata: moredata, reviewdata: reviewdata})
      })

    })
    })
})

router.post("/products", function (req,res){
  let type = req.body.type
  let name = req.body.nameofrunner
  let min = req.body.min
  let max = req.body.max
  let q = "SELECT name,price,color,image_url,type,name_id FROM product JOIN details ON product.id=details.name_id GROUP BY name_id;"
  connection.query(q, function(error,result){
    if(error) throw error;
    let x = result;
        if(type != "All"){
          x = result.filter(function(data){
            return data.type == type
          })
      } if(name){
         x = x.filter(function(data){
            return data.name.toLowerCase().indexOf(name.toLowerCase()) >= 0
        })
      } if(max){
        x = x.filter(function(data){
          return data.price < max
        })
      } if(min){
          x = x.filter(function(data){
      return data.price > min
        })
      }
      let s = "SELECT * FROM details JOIN product WHERE details.name_id=product.id GROUP BY name_id, color;"
      let w = "SELECT name,name_id,COUNT(color) as num FROM (SELECT name,name_id,color FROM details JOIN product WHERE details.name_id=product.id GROUP BY name_id, color) as numofcolor GROUP BY name_id;"

      connection.query(s, function(err, hoverdata){
        if(err) throw err;
        connection.query(w, function(err, numofcolor){
          if(err) throw err;
          res.render("products",{data: x, hoverdata: hoverdata, numofcolor: numofcolor })
      })
    })
  })
});

module.exports = router
