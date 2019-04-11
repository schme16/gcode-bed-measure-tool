
angular.module('bed-measurement-tool', [])

/*The master controller*/
.controller('master', function master($scope, $sce) {

	//window.nodeRequire('remote').getCurrentWindow().toggleDevTools()
})

/*Turns off the ng-scope, et al. debug classes*/
.config(['$compileProvider', function ($compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|mailto|itpc):/);
	$compileProvider.debugInfoEnabled(false);
}])
