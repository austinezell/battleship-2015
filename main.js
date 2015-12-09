"use strict";
var battleshipRef = new Firebase("https://basedgod.firebaseio.com/");
var themesong = new Audio("battlesongless.wav");
var playersRef = battleshipRef.child('players');
var turnRef = battleshipRef.child('turn');
let placementDoneRef = battleshipRef.child('placementDoneRef')
let numPlayers, selfRefKey, selfRef, opponentRef, playerKeys, selfBoardRef, oppBoardRef, playerNum;


function init(){
  let $playerDiv = $("#playerDiv")
  playersRef.on('value', (snap)=> {
    numPlayers = snap.numChildren();
    if (numPlayers === 2){
      playerKeys = snap.val();
      preGame();
      playersRef.off();
      $playerDiv.text("Place your ships and wait for opponent to place his/hers!")
    }
  })
  let $addPlayer = $("#addPlayer");
  $addPlayer.on('submit', function(event){
    event.preventDefault();
    let newPlayer = $('#name').val();
    addPlayer(newPlayer);
    $addPlayer.remove()
  })
  let shipPlacements = [];
  for (var i =0; i<100;i++){
    shipPlacements.push(false);
  }


  function addPlayer (playerName) {
    if (numPlayers < 2){
      $("#playerDiv").text("Waiting for another player, or open a new window to play against yourself!")
      playerNum = (numPlayers === 0) ? 1 : 2;
      selfRef = playersRef.push(playerName);
      selfRefKey = selfRef.path.o[1];
      playersRef.child(selfRefKey).onDisconnect().remove();
    }
    else alert("Too many players");
  }

  themesong.play();


  var rotated = false;
  function preGame(){
    var $square = $(".PlayBoard td");
    $("#rotate").on("click", function(){
      rotated = !rotated
    })
    var shipsToPlace = 5;
    $square.hover(highlightPlacement);
    $square.on("click", placeShips);

    function isValid(tiles){
      var valid=true
      tiles.forEach(function(tile){
        if (tile.hasClass("ship")){
          valid = false;
        }
      })
      return valid;
    }

    function placeShips(){
      if(shipsToPlace){
        var $placement = $(this),
        tiles = getTiles($placement)
        if (isValid(tiles)){
          tiles.forEach(function(tile){
            tile.addClass("ship").off();
            shipPlacements[tile.data("id")]=true;
          });
          if(!(--shipsToPlace)){
            $square.off();
            $playerDiv.text("Wait for your opponent to place!");
            assignPlayers();
          }
        }
      }
    }

    function highlightPlacement(){
      var $placement = $(this),
      tiles = getTiles($placement);
      if(isValid(tiles)){
        tiles.forEach(function(tile){
          tile.toggleClass("highlight");
        });
      }
    }
  }
  function getTiles(placement){
    var secondTile,
    firstTile;
    if (!rotated){
      if (placement.context["cellIndex"]===9){
        secondTile = placement.prev().prev()
        firstTile = placement.prev()
      } else if(placement.context["cellIndex"]===0){
        firstTile = placement.next().next()
        secondTile = placement.next()
      }else{
        firstTile = placement.next()
        secondTile = placement.prev()
      }
    }
    else{
      if (placement.data("id")<10){
        var x = placement.data("id")+10;
        var y = placement.data("id")+20;
        firstTile = $("td.player[data-id='" + x + "']");
        secondTile = $("td.player[data-id='" + y + "']");
      }else if(placement.data("id")>90){
        var x = placement.data("id")-10;
        var y = placement.data("id")-20;
        firstTile = $("td.player[data-id='" + x + "']");
        secondTile = $("td.player[data-id='" + y + "']");
      }else{
        var x = placement.data("id")-10;
        var y = placement.data("id")+10;
        firstTile = $("td.player[data-id='" + x + "']");
        secondTile = $("td.player[data-id='" + y + "']");
      }
    }
    var tiles = []
    tiles.push(firstTile, secondTile, placement)
    return tiles
  }

  function assignPlayers() {

    placementDoneRef.on('value', (snap)=> {
      if (snap.numChildren() === 2){
        gameBegin()
        placementDoneRef.off()
        turnRef.set({
          playerOne: 1
        });
      }
    })
    for (let key in playerKeys){
      if (key !== selfRefKey){
        opponentRef = playersRef.child(key)
      }
    }
    selfBoardRef = selfRef.set({
      shipLocations: shipPlacements
    })
    let tempKey = placementDoneRef.push(true).path.o[1];
    placementDoneRef.child(tempKey).onDisconnect().remove()
  }


  function gameBegin(){
    $playerDiv.text("BATTLESHIPS!");
    oppBoardRef = opponentRef.child('shipLocations');
    $("#rotate").remove();
    let isCurrentPlayerTurn;
    turnRef.on('value', (snap)=> {
      let turnVal = snap.val().playerOne;
      isCurrentPlayerTurn = turnVal;
    });
    var hits =0;


    var $OppBoard = $(".OppBoard td");
    $OppBoard.click(hitOrNah);

    function hitOrNah(e){
      e.preventDefault()
      if(isCurrentPlayerTurn=== playerNum){
        $playerDiv.text("BATTLESHIPS!");
        isCurrentPlayerTurn = isCurrentPlayerTurn === 1 ? 2 : 1;
        turnRef.set({
          playerOne: isCurrentPlayerTurn
        });

        var splash = new Audio("splash.wav");
        var explosion = new Audio("explosion.wav");
        var $guessedSquare = $(this);
        var squareVal = $guessedSquare.data("id");
        oppBoardRef.once('value', snap=>{
          let hit = snap.val()[squareVal]
          if(hit){
            explosion.play();
            $guessedSquare.addClass("hit").off();
            hits++;
            if(hits === 15){
              $OppBoard.off()
              alert("YOU WIN!");
            }
          }
          else {
            $guessedSquare.addClass("miss").off();
            splash.play();
          }
        })
      }
      else {
        $playerDiv.text("Not your turn!");
        $playerDiv.fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
      }
    }
  }
}






$(document).ready(init);
