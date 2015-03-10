define([
    'jquery', 
    'lodash',
    'jquery_cookie',
    'jquery_form',
    'backbone', 
    'modules/bbx/functions',
    'modules/media/functions',
    'modules/media/model',
    'text!/templates/' + BBX.userLang + '/media/MediaPublish.html',
    'text!/templates/' + BBX.userLang + '/media/MediaConfirmRemoveMessage.html',
    'text!/templates/' + BBX.userLang + '/media/MediaRemoveMessage.html',
], function($, _, jQueryCookie, jQueryForm, Backbone, BBXFunctions, MediaFunctions, MediaModel, MediaPublishTpl, MediaConfirmRemoveMessageTpl, MediaRemoveMessageTpl){
    var MediaUpdate = Backbone.View.extend({
	
	__getFormData: function() {
	    var media = BBX.media,
	    fields = {};
	    
	    $('#form_media_publish :input').each(function() {
		fields[this.name] = this.value;
	    });
	    
	    // TODO: adicionar tags separadas (patrimonio, publico) a tags
	    media = {
		name: fields.name,
		uuid: fields.uuid,
		origin: fields.origin,
		author: fields.author,
		repository: fields.repository,
		tags: fields.tags,
		license: fields.license,
		date: fields.date,
		type: fields.type,
		note: fields.note,		
		media_file: $('#mediafile-original').html()
	    }
	    return media;
	},

	__swapLicence: function() {
	    $('#license option:selected').each(function() {
		l = $(this);
		if (!_.isEmpty(l.val())) {
		    var license = 'license-' + l.val();
		    $('#license_image').attr('class', license);
		}
	    });		
	},

	__updateMedia: function() {
	    var config = BBX.config,   
	    mediaData = getFormData(),
	    media = null,
	    options = {},
	    urlUpdate = config.apiUrl + '/' + config.repository + '/' + config.mucua + '/media/' + mediaData.uuid;
	    media = new MediaModel([mediaData], {url: urlUpdate});
	    options.beforeSend = function(xhr){
		xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
	    };
	    //HACK para passar o objeto corretamente
	    media.attributes =  _.clone(media.attributes[0]);
	    Backbone.sync('update', media, options).done(function(){
		$('#media-update-image').attr('src', 'images/saved.png');
	    });	    
	},
	
	render: function(uuid){
	    getFormData = this.__getFormData;
	    swapLicense = this.__swapLicense;
	    updateMedia = this.__updateMedia;
	    
	    // comeca acao da funcao render
	    var config = BBX.config,   
	    urlApi = config.apiUrl + '/' + config.repository + '/' +  config.mucua + '/media/' + uuid,
	    urlMediaView = config.interfaceUrl + config.repository + '/' +  config.mucua + '/media/' + uuid;
	    BBXFunctions.renderSidebar();
	    
	    var media = new MediaModel([], {url: urlApi});
	    media.fetch({
		success: function() {
		    // TODO: passar caminho da imagem preview
		    media.image_preview = '';		    
		    var data = {
			media: media.attributes,
			urlMediaView: urlMediaView,
			types: MediaFunctions.getMediaTypes(),
			licenses: MediaFunctions.getMediaLicenses(),
			page: 'MediaUpdate',
			pageTitle: 'Editar conteúdo'
		    }
		    BBX.media = media;
		    var compiledTpl = _.template(MediaPublishTpl, data);
		    $('#content').html(compiledTpl);  
		    
		    $('#origin').append("<option value='" + media.attributes.origin + "'>" + media.attributes.origin + "</option>");
		    $('#origin').attr('disabled', true);
		    
		    var csrftoken = $.cookie('csrftoken');
		    $('#csrfmiddlewaretoken').attr('value', csrftoken);
		    
		    // eventos		  
		    $('#license').on('change', swapLicense);
		    
		    $('#submit').on('click', function() { updateMedia(); });
		    $('#view-media').on('click', function() { 
			window.location.href = urlMediaView;
		    });
		    $('#delete-media').on('click', function() {
			var deleteMedia = confirm(MediaConfirmRemoveMessageTpl);
			if (deleteMedia) {
			    var urlDelete = config.apiUrl + '/' + config.repository + '/' +  config.mucua + '/media/' + uuid + '/remove',
				mediaDelete = new MediaModel([], {url: urlDelete}),
				urlRedirect = config.interfaceUrl + config.repository + '/' +  config.mucua + '/bbx/search';
			    
			    mediaDelete.fetch({
				success: function() {
				    $('.buttons').prepend(MediaRemoveMessageTpl);
				    setTimeout(function(){
					window.location.href = urlRedirect;
				    }, 2000);
				}
			    });
			}	
		    });
		    
		}
	    });
	},
    });

    return MediaUpdate;
});
