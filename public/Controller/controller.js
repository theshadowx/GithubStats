'use strict';

var myApp = angular.module('myApp',['ngMaterial']);

myApp.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('input');
    $mdThemingProvider.theme('docs-dark', 'default')
});

myApp.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io();
    return socket;
}]);


myApp.controller('AppCtrl', ['$scope', '$http', 'socket', '$timeout', '$mdSidenav', function($scope, $http, socket, $timeout, $mdSidenav){
    console.log("hi there");

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      }
    }

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