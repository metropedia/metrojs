angular.module('metro')

.directive('metroDesigner', function() {
  return {
    scope: {
      plugins: '='
    },
    templateUrl: '../src/app.html',
    controller: 'metroDesigner',
    controllerAs: 'app',
  };
})
;
