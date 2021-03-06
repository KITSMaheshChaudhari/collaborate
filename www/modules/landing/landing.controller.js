(function (){
    angular.module("app")
    .controller("landingController",landingController);
    
    landingController.$inject = ["$scope", "$log", "$state" ,"dataService", "config","authService"];
    
    function landingController($scope, $log, $state, dataService, config, authService){
        $scope.user = null
        $scope.startApp = function(){
            if(authService.isLoggedIn){
                $state.go("home.dashboard");
            }
            else{
                $state.go("account.login");
            }
        }
        function init(){
            if(authService.isLoggedIn){
                $scope.user = authService.userDetail
                    
            }
        }

        init();
    }//conroller ends
})();