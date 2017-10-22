'use strict';

var myApp = angular.module('myApp',['ngMaterial','angular-moment', 'ngRoute', 'ngMessages', 'restangular']);

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


    var yesterday = moment().format('L');
    var monthOlder = moment().subtract(28, 'days').format('L');
    this.myDateStart = new Date(monthOlder);
    this.myDateEnd = new Date(yesterday);
    this.isOpen = false;

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
    var rangeChart;

    var countAll = 0;
    var countLinux = 0;
    var countWindows = 0;
    var countMac = 0;

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
    
    var updateRangeStatChart = function(data){
        if(rangeChart != null){

            var dateArray = [];
            var current = monthOlder;
            dateArray.push(current);
            while(current != yesterday){
                current = moment(current, "MM/DD/YYYY").add(1, 'days').format('L');
                dateArray.push(current);
            }

            rangeChart.data.labels = dateArray;
            rangeChart.data.datasets[0].data = data;
        }

        rangeChart.update();
    };

    var createTotalChart = function(){
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
        }else{
            console.error("can't find total Chart");
        }
    }

    var createHourChart = function(){
        var elHour = document.getElementById("githubChartHour");
        if(elHour != null){
            var ctxHour = elHour.getContext('2d');
            var mlabels = _.rangeRight(1,61);
            var mdata = _.rangeRight(0,60,0);
            
            if(ctxHour != null){
                hourChart = new Chart(ctxHour, {
                    type: 'bar',
                    data: {
                        labels: mlabels,
                        datasets: [{
                            data: mdata,
                            backgroundColor: 'rgba(104, 171, 89,1)',
                            borderWidth: 0
                        }]
                    },
                    options: chartOptions
                });
            }
        }else{
            console.error("can't find hour Chart");
        }
    }

    var createDayChart = function(){
        var elDay = document.getElementById("githubChartDay");
        if(elDay != null){
            var ctxDay = elDay.getContext('2d');
            var mlabels = _.rangeRight(1,25);
            var mdata = _.rangeRight(0,24,0);
            
            if(ctxDay != null){
                dayChart = new Chart(ctxDay, {
                    type: 'bar',
                    data: {
                        labels: mlabels,
                        datasets: [{
                            data: mdata,
                            backgroundColor: 'rgba(94, 142, 200,1)',
                            borderWidth: 0
                        }]
                    },
                    options: chartOptions
                });
            }
        }else{
            console.error("can't find day Chart");
        }
    }

    var createRangeChart = function(){
        var elRange = document.getElementById("rangeChart");
        if(elRange != null){
            var ctxRange = elRange.getContext('2d');
            var mlabels_range = _.rangeRight(1,29);
            var mdata_range = _.rangeRight(0,28,0);
            
            if(ctxRange != null){
                rangeChart = new Chart(ctxRange, {
                    type: 'bar',
                    data: {
                        labels: mlabels_range,
                        datasets: [{
                            data: mdata_range,
                            backgroundColor: 'rgba(229, 200, 80, 1)',
                            borderWidth: 0
                        }]
                    },
                    options: chartOptions
                });
            }
        }else{
            console.error("can't find range Chart");
        }
    }

    var createCharts = function(){
        createTotalChart();
        createHourChart();
        createDayChart();
        createRangeChart();
    }

    var requestRangeStat = function(startDate, endDate){
        socket.emit ('rangeStatRequest', {start: startDate , end: endDate});
    };

    addEventListener('load', createCharts, false);

    socket.on('updateRecordTotal', updateChartTotal);
    socket.on('updateRecordHour', updateChartHour);
    socket.on('updateRecordDay', updateChartDay);
    socket.on('respondRangeStat', updateRangeStatChart);

    requestRangeStat(monthOlder, yesterday);

}]);
