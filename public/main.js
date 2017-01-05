var app = angular.module("superfire", [
    "firebase",
    "ngStorage"
]);

app.controller("MainCtrl", function($scope, $localStorage, $interval, playerService, canvasService, wallsService){

    var move_rate = 10;
    var draw_frequency = 20;

    var playerProperties = playerService.playerProperties;

    var keys = {
        39: {on:false, axis:'x', negate:false},  // right
        37: {on:false, axis:'x', negate:true},  // left
        38: {on:false, axis:'y', negate:true},  // up
        40: {on:false, axis:'y', negate:false}  //down
    };

    wallsService.walls.$loaded().then(function(){
       $scope.walls = wallsService.walls;
    });
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
        var moved = false;
        angular.forEach(keys, function(info, code) {
            if(info.on) {
                distance = (info.negate) ? (move_rate * -1) : move_rate;
                $scope.self.position[info.axis] += getRevisedPlayerCollisionDistance(info.axis, distance);
                moved = true;
            }
        });
        if(moved) {
            checkBoundaries();
            $scope.players.$save($scope.self);
        }
    }

    function checkBoundaries() {
        var pHeight = playerProperties.height;
        var pWidth = playerProperties.width;
        var canvas = $('#canvas');
        var cHeight = canvas.height();
        var cWidth = canvas.width();
        if ($scope.self.position.x <= 0) $scope.self.position.x = 0;
        if (( $scope.self.position.x + pWidth) >= cWidth) $scope.self.position.x = cWidth - pWidth;
        if ($scope.self.position.y <= 0) $scope.self.position.y = 0;
        if (($scope.self.position.y + pHeight) >= cHeight) $scope.self.position.y = cHeight - pHeight;
    }

    function getRevisedPlayerCollisionDistance(axis, distance) {
        var myAdjustment = 0;
        var theirAdjustment = 0;
        var wallAdjustment = 0;
        if(axis === 'y' && distance > 0){
            myAdjustment = playerProperties.height;
        }
        else if(axis === 'y' && distance < 0){
            theirAdjustment = playerProperties.height;
        }
        else if(axis === 'x' && distance > 0){
            myAdjustment = playerProperties.width;
        }
        else if(axis === 'x' && distance < 0){
            theirAdjustment = playerProperties.width;
        }
        var movedPlayerTest = {
                x:$scope.self.position.x,
                y:$scope.self.position.y
        };
        movedPlayerTest[axis] += distance;
        var collision = false;
        var diff = 0;
        angular.forEach($scope.players, function(player){
            if(player != $scope.self){
                if(isObjectsSharingAxis('x', movedPlayerTest, player.position, playerProperties.width, playerProperties.width) && isObjectsSharingAxis('y', movedPlayerTest, player.position, playerProperties.height, playerProperties.height)){
                    // collision, find difference of moved axis and adjust distance
                    diff = (movedPlayerTest[axis] + myAdjustment) - (player.position[axis] + theirAdjustment);
                    distance -= diff;
                    collision = true;
                    return false;
                }
            }
        });
        if(!collision) {
            angular.forEach($scope.walls, function (wall) {
                if (isObjectsSharingAxis('x', movedPlayerTest, wall, playerProperties.width, wall.width) && isObjectsSharingAxis('y', movedPlayerTest, wall, playerProperties.height, wall.height)) {
                    // collision, find difference of moved axis and adjust distance
                    var wallAdjustment = (axis === 'y' && distance < 0) ? playerProperties.height : 0;
                    wallAdjustment = (axis === 'x' && distance < 0) ? wall.width : 0;
                    diff = (movedPlayerTest[axis] + myAdjustment) - (wall[axis] + wallAdjustment);
                    distance -= diff;
                    return false;
                }
            });
        }
        return distance;
    }

    function isObjectsSharingAxis(axis, obj1, obj2, obj1Size, obj2Size){
        var o1v1 = obj1[axis];
        var o1v2 = obj1[axis] + obj1Size;
        var o2v1 = obj2[axis];
        var o2v2 = obj2[axis] + obj2Size;
        if(o1v1 <=  o2v1 && o1v2 > o2v1) {
            return true;
        }
        else if(o1v1 >  o2v1 && o1v1 < o2v2){
            return true;
        }
        return false;
    }

});

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
