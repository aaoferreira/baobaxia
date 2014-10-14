define([
    'jquery', 
    'underscore',
    'backbone',
    'jquery_cookie',
    'modules/bbx/functions',
], function($, _, Backbone, jQueryCookie, jQueryJson, BBXFunctions){
    var LogoutView = Backbone.View.extend({
	doLogout: function() {
	    console.log('logout');

	    if ($.cookie('sessionBBX')) {
		$.removeCookie('sessionBBX');
	    }
	    $("body").data("bbx").userData = undefined;
	    $('#header').html('');
	    $('#content').html('');
	    $('#sidebar').detach();
	    $('#footer').html('');
	}
    });
    
    return LogoutView;
});
