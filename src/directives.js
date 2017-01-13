angular.module('metro')

.directive('metro', function() {
  return {
    scope: {
      topic: '='
    },
    templateUrl: '../src/metro.html',
    controller: 'metro',
    controllerAs: 'ctrl',
  };
})
;
