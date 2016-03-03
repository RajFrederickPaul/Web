(function(){
    'use strict';

    var myApp =  angular.module("myApp",['ngRoute']);


    myApp.config(function($routeProvider){

        $routeProvider

            .when('/results',{
                templateUrl:'paths/results.html'
               ,controller:"ResultsController as vm"
            })

            .when('/sample',{
                templateUrl:'paths/sample.html'
            })

            .when('/default',{
                templateUrl:'paths/default.html'
            })

            .otherwise({redirectTo:'/default'});

    });

    myApp.controller('ResultsController',ResultsController);

    function ResultsController(){
        var vm=this;
        if(typeof curData[0] === 'undefined'){
            choosePage('#default');
            return;
        }

        setSVG();
        correctKeys();

        vm.months=monthsGiven;
    }


})();
