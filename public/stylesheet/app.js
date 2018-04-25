document.getElementById("reviews-btn").addEventListener("click", function(){
document.getElementsByClassName("minus")[1].classList.toggle("show-minus");
document.getElementsByClassName("plus")[1].classList.toggle("hide-plus")
$(".review-info").toggleClass("show-info")
})

document.getElementById("delivery-and-returns-btn").addEventListener("click", function(){
document.getElementsByClassName("minus")[0].classList.toggle("show-minus");
document.getElementsByClassName("plus")[0].classList.toggle("hide-plus")
$(".delivery-info").toggleClass("show-info")
})




function changeImage(e){
  $(".small-image"+e).hover(function(){
    $(".big-product-image"+e).attr("src",this.src);
    })
  }
