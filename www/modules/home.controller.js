(function (){
    angular.module("app")
    .controller("homeController",homeController);
    
    homeController.$inject = ["$scope", "$rootScope", "$log", "$window", "$q", "$localStorage", "toaster", "$state", "$stateParams", "dataService", 
        "config", "authService", "$uibModal"];
    
    function homeController($scope, $rootScope, $log, $window, $q, $localStorage, toaster, $state, $stateParams, dataService, 
        config, authService, $uibModal){
        
        //bindable mumbers
        $scope.mainTitle  = "Collaborate";
        $scope.nextTheme = _nextTheme
        $scope.themes = config.themes,
        $scope.theme = $localStorage.theme;
        $scope.user = $localStorage.__splituser;
        //$scope.fabOpen = false;
        $scope.groupsList = [];
        
        $scope.nodeParentTrail=[];
        $scope.selectedMenu = null;
        $scope.menu = null;
        
        if($scope.theme == undefined){
            $scope.theme = 0;
        }
        
        
        $scope.logoff = function(ev){
            //TODO; Ask for confirmation here
            
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                  .title('Log off')
                  .textContent('Unsaved data will be lost. Are you sure you want to logoff?')
                  .ariaLabel('Lucky day')
                  .targetEvent(ev)
                  .ok('Yes, Log off.')
                  .cancel('No, Do not logoff');

            $mdDialog.show(confirm)
            .then(function() {
                authService.logOut();
                $state.go("landing")
                }, 
                function() {
                    $scope.status = 'You decided to keep your debt.';
                });
           
        }
        $scope.toggleLeft = function(){
            return $mdSidenav('left')
            .toggle();
        }

        function _toggleLeft(){
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                  .title('Log off')
                  .textContent('Unsaved data will be lost. Are you sure you want to logoff?')
                  .ariaLabel('Lucky day')
                  .targetEvent(ev)
                  .ok('Yes, Log off.')
                  .cancel('No, Do not logoff');

            $mdDialog.show(confirm)
            .then(function() {
                authService.logOut();
                $state.go("landing")
                }, 
                function() {
                    $scope.status = 'You decided to keep your debt.';
                });
           
        }
        $scope.toggleSideBar = function(id){
            return $mdSidenav(id)
            .toggle();
        }

        $scope.historyBack = function(){
            $window.history.back();
        }
        
        //Set next theme
        function _nextTheme (){
            if(($scope.theme + 1) >= config.themes.length){
                $scope.theme = 0;
            }
            else{
                $scope.theme++;
            }
            
            //storageService.add("theme",$scope.theme) ;	
            
            
        }

        function getGroups (){
            var p = dataService.getGroups()
            .then(function(d){
                angular.copy(d.data.data, $scope.groupsList);
                var sectionHeader = {
                        id: 'Groups',
                        name: 'Groups',
                        children: [],
                        icon:'group'
                }

                //build menu sections
                $scope.groupsList.forEach(function(g){
                   
                   var section = {
                       id:g._id,
                       name: g.name,
                       icon:'people_outline',
                       children:[
                            {
                                id:g._id + 1,
                                name: 'Assets',
                                icon:'list',
                                parentId:g._id
                            },
                       ] 
                   };
                   sectionHeader.children.push(section);
                });
                
                $scope.menu = sectionHeader;
            },
            function(e){

            });
            return p;
        }
        $scope.onSelect = function(node){
            $log.debug(node);
            $scope.selectedMenu = node;

            switch (node.Name) {
                case "Groups":{
                    $state.go("home.groups", {"g":node.parentId});
                    break;
                }
                case "Assets":{
                    $state.go("home.group.assets", {"g":node.parentId, "p":node.parentId});
                    break;
                }
            }            
        }
        
        var preInit = function(){
            var tasks = [];
            tasks.push(getGroups());
            var initPromice = $q.all(tasks)
            .then(function(){
                init()
            });
            $rootScope.__busy = initPromice;
        }
        
        var init = function(){

        };

        preInit();

    }//conroller ends
})();