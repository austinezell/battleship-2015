go()

function go() {
  var gameRef = new Firebase("https://battleship-2015.firebaseio.com/");
  var usa = confirm('USA good or click cancel for Mother Russia');
  var userId = usa ? "usa" : "ussr"
  console.log(userId);
};
