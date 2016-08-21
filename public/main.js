var app = angular.module("superfire", [
    "firebase",
    "ngStorage"
]);

app.controller("MainCtrl", function($scope, $localStorage, $interval, playerService, canvasService){

    var move_rate = 10;
    var draw_frequency = 20;
    var playerProperties = {
        width: 30,
        height:30
    };


    var keys = {
        39: {on:false, axis:'x', negate:false},  // right
        37: {on:false, axis:'x', negate:true},  // left
        38: {on:false, axis:'y', negate:true},  // up
        40: {on:false, axis:'y', negate:false}  //down
    };


    playerService.players.$loaded().then(function() {
        $scope.players = playerService.players;
        var playerId = $localStorage.playerId;
        $scope.self = $scope.players.$getRecord(playerId);
        if(!playerId || !$scope.self) {
            $scope.newPlayer = true;
        }
        else {
            initControls();
        }
        $scope.joinGame = function () {
            playerService.createPlayer($scope.player).then(function (player) {
                $scope.self = $scope.players.$getRecord( player.key());
                $scope.newPlayer = false;
                $localStorage.playerId = player.key();
            });
            initControls();
        };

        $interval(function(){
            checkMovement();
            canvasService.drawPlayers();
        }, draw_frequency);
    });

    function initControls() {
        $(document).keydown(function(evt) {
            angular.forEach(keys, function(info, code) {
                if(evt.keyCode == code) {
                    info.on = true;
                }
            });
        });
        $(document).keyup(function(evt) {
            angular.forEach(keys, function(info, code) {
                if(evt.keyCode == code) {
                    info.on = false;
                }
            });
        });
    }

    function checkMovement(){

        var pHeight = playerProperties.height;
        var pWidth = playerProperties.width;
        var cHeight = $('#canvas').height();
        var cWidth = $('#canvas').width();
        var moved = false;
        angular.forEach(keys, function(info, code) {
            if(info.on) {
                distance = (info.negate) ? (move_rate * -1) : move_rate;
                $scope.self.position[info.axis] += distance;
                moved = true;
            }
        });
        if(moved) {
            if ($scope.self.position.x <= 0) $scope.self.position.x = 0;
            if (( $scope.self.position.x + pWidth) >= cWidth) $scope.self.position.x = cWidth - pWidth;
            if ($scope.self.position.y <= 0) $scope.self.position.y = 0;
            if (($scope.self.position.y + pHeight) >= cHeight) $scope.self.position.y = cHeight - pHeight;
            $scope.players.$save($scope.self);
        }
    }

});

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
