var _fireBaseDB = 'https://fir-62527.firebaseio.com/superfire';
var app = angular.module("superfire");


app.factory("playerService", function($firebaseArray) {
    var service = {};

    var ref = new Firebase(_fireBaseDB + '/players');
    service.players = $firebaseArray(ref);

    service.createPlayer = function(newPlayer) {
        newPlayer.created_at = Firebase.ServerValue.TIMESTAMP;
        newPlayer.health = 100;
        newPlayer.position = {x: 0, y: 0};
        var r = getRandomInteger(0,9);
        var g = getRandomInteger(0,9);
        var b = getRandomInteger(0,9);
        newPlayer.color = '#'+r+r+''+g+g+''+b+b;
        return service.players.$loaded().then(function(){
            return service.players.$add(newPlayer).then(function(ref) {
                return ref;
            });
        });
    };

    return service;
});


app.factory("canvasService", function($interval, playerService) {
    var service = {};

    var draw_frequency = 1;
    var playerProperties = {
        width: 30,
        height:30
    };

    var canvas = document.getElementById("canvas").getContext('2d');

    //clear the canvas
    service.clearCanvas = function() {
        canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
    };

    service.drawPlayers = function(){
        service.clearCanvas();
        angular.forEach(playerService.players, function(player){
            canvas.fillStyle=player.color;
            canvas.fillRect(player.position.x, player.position.y, playerProperties.width, playerProperties.height);
        });
    };

    return service;
});