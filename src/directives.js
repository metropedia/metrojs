angular.module('metro')

.directive('metroDesigner', function() {
  return {
    scope: {
      topic: '='
    },
    templateUrl: '../src/metro.html',
    controller: 'metroDesigner',
    controllerAs: 'ctrl',
  };
})
;
