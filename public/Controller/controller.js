var myApp = angular.module('myApp',[]);

myApp.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect('http://localhost:3000');
    return socket;
}]);


myApp.controller('AppCtrl', ['$scope', '$http', 'socket', function($scope, $http, socket){
    console.log("hi there");

    $scope.contactList=[];

    socket.on('updateContactAdded', function(data) {
        console.log("updateContactAdded : " + JSON.stringify(data));
        $scope.contactList.push(data);
        $scope.$apply();

    });

    // get
    var refresh = function(){
        $http.get('/containerList').success(function(response){
            console.log("got data");
            $scope.contactList = response;
            $scope.contact = "";
        });
    }

    refresh();

    // post
    $scope.addContact = function(){
        console.log($scope.contact);
        socket.emit('contactAdded', $scope.contact);
        $scope.contact = "";
    };

}]);