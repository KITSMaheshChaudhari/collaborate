
(function (){
    angular.module("app")
    .controller("groupBoardController",groupBoardController);
    
    groupBoardController.$inject = ["$scope", "$rootScope", "$log", "$q", "$localStorage", "$state", "$stateParams" ,"dataService", "config","authService"];
    
    function groupBoardController($scope, $rootScope,  $log, $q, $localStorage, $state, $stateParams, dataService, config, authService ){
        
        //bindable mumbers
        $scope.title = "";
        $scope.promices = {};
        $scope._id = $stateParams.g;
        $scope.group = null;
        $scope.groupCopy = null;
        $scope.selectedMembers = null;
        $scope.view = $stateParams.v;
        $scope.searchText ="";
        $scope.searchResult = [];
        
        function showSimpleToast (message) {
            $mdToast.show(
                $mdToast.simple()
                .textContent(message)
                .position('bottom')
                .hideDelay(3000)
                .action('OK')
            );
        };

        var preInit = function(){
            var tasks = [];
            tasks.push(getGroupDetail());
            tasks.push(getTopics());
            $rootScope.__busy  = $q.all(tasks)
            .then(function(){
                init()
            });
        }

        var init = function(){

        };
        
        $scope.details = function(){
            $state.go("home.group.detail",{"g": $scope.group._id});
            $scope.mainTitle = $scope.group.name;
        }
        $scope.editGroup = function(){
            $state.go("home.group.detail",{"g": $scope._id});
        }
        function getGroupDetail (){
            var p =  dataService.getGroup($scope._id)
            .then(function(d){
                $scope.group = angular.copy(d.data.data[0]);
                $scope.title = $scope.group.name;
                if($scope.group.members){
                    $scope.group.members.forEach(function(m){
                        m._name = m.firstName + ' ' + m.lastName;
                    })
                }
                $scope.groupCopy = angular.copy($scope.group);
            },
            function(e){

            });
            return p;
        }
        function getTopics (){
            var p = dataService.getAssets({groupId:$scope._id})
            .then(function(d){
                $scope.topics = angular.copy(d.data.data);
            },
            function(e){

            });

            return p;
        }
        
        $scope.newTopic = function(){
            $state.go("home.asset", { "g": $scope._id, "t": "type_collection" });
        }
        preInit();


    }//conroller ends
})();