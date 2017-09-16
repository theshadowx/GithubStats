'use strict';

var myApp = angular.module('myApp',['ngMaterial','ngRoute', 'restangular']);

myApp.config(function($mdThemingProvider) {
    //$mdThemingProvider.theme('input');
    $mdThemingProvider.theme('docs-dark', 'default');
    $mdThemingProvider.theme('altTheme')
         .primaryPalette('grey',{
        'default': '900'})
         .accentPalette('grey',{
        'default': '900'})
    .dark();

    $mdThemingProvider.theme('default')
    .dark();

    $mdThemingProvider.setDefaultTheme('altTheme');
    $mdThemingProvider.alwaysWatchTheme(true);

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
    $scope.dayDownloads = 0;
    $scope.hourDownloads = 0;

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    // chart
    var totalChart;
    var hourChart;
    var dayChart;

    var ChartGuideLinesColor = 'rgba(140, 140, 140,1)';
    var chartOptions = {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true,
                    padding: 5
                },
                gridLines: {
                    color: ChartGuideLinesColor,
                    zeroLineColor : ChartGuideLinesColor,
                    drawBorder : false,
                    tickMarkLength: 3
                }
            }],
            xAxes: [{
                display: false,
                gridLines: {
                    display : false
                }
            }]
        }
    };

    var totalChartOptions = JSON.parse(JSON.stringify(chartOptions));
    totalChartOptions.scales.xAxes[0].display = true;

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      }
    }


    var updateChartHour = function(data){
        var dataLength = data.length - 2;
        var i = dataLength;
        var hourDownloadsValue = 0;

        data.forEach(function(element){
            if(i !== -1){
                hourDownloadsValue += element.minuteTotal;
                if(hourChart != null)
                    hourChart.data.datasets[0].data[i] = element.minuteTotal;
                i--;
            }
        });

        $scope.$apply(function(){
            $scope.hourDownloads = hourDownloadsValue;
        });
        if(hourChart != null)
            hourChart.update();
    };

    var updateChartDay = function(data){
        var dataLength = data.length - 1;
        var i = dataLength;
        var dayDownloadsValue = 0;
    
        data.forEach(function(element){
            if(i !== -1){
                dayDownloadsValue += element.hourTotal;
                if(dayChart != null)
                    dayChart.data.datasets[0].data[i] = element.hourTotal;
                i--;
            }
            
        });

        $scope.$apply(function(){
            $scope.dayDownloads = dayDownloadsValue;
        });
        if(dayChart != null)
            dayChart.update();
    };

    var updateChartTotal = function(data){
        if(totalChart != null){
            if(data.length > 0) {
                totalChart.data.datasets[0].data = [data[0].macCnt, data[0].windowsCnt, data[0].linuxCnt, data[0].totalCnt];
            }else{
                totalChart.data.datasets[0].data = [0, 0, 0, 0];
            }
            totalChart.update();
        }
    };


    socket.on('updateRecordTotal', updateChartTotal);
    socket.on('updateRecordHour', updateChartHour);
    socket.on('updateRecordDay', updateChartDay);


    var countAll = 0;
    var countLinux = 0;
    var countWindows = 0;
    var countMac = 0;
    
    var elTotal = document.getElementById("githubChart");
    if(elTotal != null){
        var ctx = elTotal.getContext('2d');
        if(ctx!=null){
            totalChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Mac", "Windows", "Linux", "Total"],
                    datasets: [{
                        data: [countMac, countWindows, countLinux, countAll],
                        backgroundColor: [
                            'rgb(251, 167, 48)',
                            'rgb(203, 70, 59)',
                            'rgb(190, 76, 101)',
                            'rgb(137, 81, 154)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: totalChartOptions
            });
        }
    }

    var elHour = document.getElementById("githubChartHour");
    if(elHour != null){
        var ctxHour = elHour.getContext('2d');
        if(ctxHour != null){
            hourChart = new Chart(ctxHour, {
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
                options: chartOptions
            });
        }
    }   

    var elDay = document.getElementById("githubChartDay");
    if(elDay != null){
        var ctxDay = elDay.getContext('2d');
        if(ctxDay != null){
            dayChart = new Chart(ctxDay, {
                type: 'bar',
                data: {
                    labels: [24,23,22,21,20,19,18,17,
                             16,15,14,13,12,11,10,9,
                             8,7,6,5,4,3,2,1],
                    datasets: [{
                        data: [0,0,0,0,0,0,0,0,
                               0,0,0,0,0,0,0,0,
                               0,0,0,0,0,0,0,0],
                        backgroundColor: 'rgba(94, 142, 200,1)',
                        borderWidth: 0
                    }]
                },
                options: chartOptions
            });
        }
    }

}]);
