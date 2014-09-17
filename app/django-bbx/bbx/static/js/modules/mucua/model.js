define([
    'jquery',
    'underscore',
    'backbone',
    'modules/media/model'
], function($, _, Backbone, MediaModel) {
    var MucuaModel = Backbone.Model.extend({
	idAttribute: 'uuid',

	/**
	 * Get mucua image:
	 *
	 * search on media if there's any media with it's uuid
	 *
	 * @return image
	 */
	getImage: function(url, callback) {
	    var defaultImageSrc = '/images/mucua-default.png',
	    media = new MediaModel([], {url: url});
	    
	    media.fetch({
		success: function() {
		    if(!_.isEmpty(media.attributes)) {
			var imageSrc = media.attributes[0].url;
		    } else {
			var imageSrc = defaultImageSrc;
		    }
		    if (typeof callback == 'function') {
			callback(imageSrc);
		    }
		}
	    });	
	}
    });
    
    return MucuaModel;	
});
