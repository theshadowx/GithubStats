'use strict';

var myApp = angular.module('myApp',['ngMaterial','ngRoute', 'restangular']);

myApp.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('input');
    $mdThemingProvider.theme('docs-dark', 'default');

}).config(function(RestangularProvider) {
    RestangularProvider.setBaseUrl('https://api.github.com/repos/nuttyartist/notes/releases/');
});

myApp.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io();
    return socket;
}]);

myApp.controller('AppCtrl', ['$scope', '$http', 'socket', '$timeout', '$mdSidenav', 'Restangular', function($scope, $http, socket, $timeout, $mdSidenav, Restangular){
    console.log("hi there");

    

    $scope.repoName = "Notes";
    $scope.releaseTag = "v1.0.0";


    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      }
    }


    var updateChartHour = function(data){
        var dataLength = data.length - 2;
        var i = dataLength;
    
        data.forEach(function(element){
            if(i !== -1){
                myChartHour.data.datasets[0].data[i] = element.minuteTotal;
                i--;
            }
            
        });
        myChartHour.update();
    };

    var updateChartDay = function(data){
        var dataLength = data.length - 1;
        var i = dataLength;
    
        data.forEach(function(element){
            if(i !== -1){
                myChartDay.data.datasets[0].data[i] = element.hourTotal;
                i--;
            }
            
        });
        myChartDay.update();
    };

    var updateChartTotal = function(data){
        if(data.length > 0) {
            myChart.data.datasets[0].data = [data[0].macCnt, data[0].windowsCnt, data[0].linuxCnt, data[0].totalCnt];
        }else{
            myChart.data.datasets[0].data = [0, 0, 0, 0];
        }
        myChart.update();
    };


    socket.on('updateRecordTotal', function(data) {
        //console.log("Total ****************************");
        //console.log(data);
        updateChartTotal(data);
    });
  

    socket.on('updateRecordHour', function(data) {
        //console.log("Hour ****************************");
        //console.log(data);
        updateChartHour(data);
        //updateTotal(data);
    });

    socket.on('updateRecordDay', function(data) {
        //console.log("Day ****************************");
        //console.log(data);
        updateChartDay(data);
    });


    var countAll = 0;
    var countLinux = 0;
    var countWindows = 0;
    var countMac = 0;

    var ctx = document.getElementById("githubChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Mac", "Windows", "Linux", "Total"],
            datasets: [{
                label: '# of downloads',
                data: [countMac, countWindows, countLinux, countAll],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    var ctxHour = document.getElementById("githubChartHour").getContext('2d');
    var myChartHour = new Chart(ctxHour, {
        type: 'bar',
        data: {
            labels: [60,59,58,57,56,
                     55,54,53,52,51,
                     50,49,48,47,46,
                     45,44,43,42,41,
                     40,39,38,37,36,
                     35,44,43,32,31,
                     30,29,28,27,26,
                     25,24,23,22,21,
                     20,19,18,17,16,
                     15,14,13,12,11,
                     10,9,8,7,6,
                     5,4,3,2,1],
            datasets: [{
                label: '# of downloads / minute',
                data: [0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0,
                       0,0,0,0,0],
                backgroundColor: 'rgba(104, 171, 89,1)',
                borderWidth: 0
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }],
                xAxes: [{
                    display: false
                }]
            }
        }
    });

    var ctxDay = document.getElementById("githubChartDay").getContext('2d');
    var myChartDay = new Chart(ctxDay, {
        type: 'bar',
        data: {
            labels: [24,23,22,21,20,19,18,17,
                     16,15,14,13,12,11,10,9,
                     8,7,6,5,4,3,2,1],
            datasets: [{
                label: '# of downloads',
                data: [0,0,0,0,0,0,0,0,
                       0,0,0,0,0,0,0,0,
                       0,0,0,0,0,0,0,0],
                backgroundColor: 'rgba(94, 142, 200,1)',
                borderWidth: 0
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }],
                xAxes: [{
                    display: false
                }]
            }
        }
    });

}]);
