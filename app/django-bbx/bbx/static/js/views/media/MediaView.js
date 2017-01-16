define([
    'jquery', 
    'lodash',
    'backbone',
    'modules/media/functions',
    'modules/media/model',
], function($, _, Backbone, MediaFunctions, MediaModel){
    
    var MediaView = Backbone.View.extend({
	
	render: function(uuid){
	    console.log("view media " + uuid);	    
	    var config = BBX.config,
		media = '',
		url = config.apiUrl + '/' + config.repository + '/' + config.mucua + '/media/' + uuid,
		urlWhereis = config.apiUrl + '/' + config.repository + '/' + config.mucua + '/media/' + uuid + '/whereis',
		userData = localStorage.userData,
		mediaWidth = (typeof(BBX.config.images.mediaView) !== 'undefined') ? BBX.config.images.mediaView.width : '0', // default value if size unset at config.js
		mediaHeight = (typeof(BBX.config.images.mediaView) !== 'undefined') ? BBX.config.images.mediaView.height : '300'; // default value if size unset at config.js
	    
	    // pergunta se vai excluir cópia local do arquivo
	    var askDrop = function() {
		var config = BBX.config;
		
		BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/MediaDropMessage', function (MediaDropMessageTpl) {
		    var dropMedia = confirm(MediaDropMessageTpl);
		    if (dropMedia) {
			var urlDrop = config.apiUrl + '/' + config.repository + '/' +  config.mucua + '/media/' + uuid + '/drop',
			    mediaDrop = new MediaModel([], {url: urlDrop});
			
			mediaDrop.fetch({
			    success: function() {
				setTimeout(function(){
				    window.location.reload();
				}, 500);
			    }
			});
		    }		    
		});
	    }
	    
	    if (userData) {
		config.userData = userData;
	    } else {
		config.userData = {};
	    }
	    
	    $('#buscador').remove();
	    $('#header-results').remove();
	    $('.media-display-type').remove();
	    BBXFunctions.renderUsage();
	    BBXFunctions.renderSidebar();
	    
	    // set focus on back to results button
	    var focus = setInterval(function() {
		var activeElId = document.activeElement.id;
		if (activeElId != '.back-to-results') {
		    $('.back-to-results').focus();
		    clearInterval(focus);
		}
	    }, 500);

	    media = MediaFunctions.getMedia(url, function(data) {
		data.formatDate = BBXFunctions.formatDate;
		data.media = data.medias[0];
		data.config = config;
		data.baseUrl = BBXFunctions.getDefaultHome();
		data.isLogged = BBXFunctions.isLogged;
		
		BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/BackToSearch', function(BackToSearchTpl) {
		    $('#header-bottom').append(_.template(BackToSearchTpl, data));
		});
		
		BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/MediaView', function(MediaViewTpl) {
		    $('#content').html(_.template(MediaViewTpl, data));
		});
		$('#drop-local-copy').on('click', function() {askDrop(media)});
		if (!data.media.is_local) {
		    BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/MessageRequest', function(MessageRequestTpl) {
			$('#message-request').html(_.template(MessageRequestTpl, data));
		    });
		    
		}
		MediaFunctions.bindRequest(uuid, '.request-copy', function() {
		    BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/MessageRequest', function(MessageRequestTpl) {
			var requestData =  {
			    'media': {'is_requested': true}
			};
			
			$('#message-request').html(_.template(MessageRequestTpl, requestData));
			$('.request-copy').addClass('requested-copy').removeClass('request-copy');
		    });		    
		});
		
	    }, {'width': mediaWidth, 'height': mediaHeight });
	    
	    // who has the file
	    var dataWhereis = new MediaModel([], {url: urlWhereis});
	    dataWhereis.fetch({
		success: function() {
		    BBXFunctions.getTemplateManager('/templates/' + BBX.userLang + '/media/MucuaHasFile', function(MucuaHasFileTpl) {
			var mucuas = dataWhereis.attributes.whereis;
			_.each(mucuas, function(mucua) {
			    var data = {
				config: config,
				mucua: mucua
			    };
			    $('#whereis').append(_.template(MucuaHasFileTpl, data));
			});
		    });
		}
	    });
	}
    });
    return MediaView;
});
