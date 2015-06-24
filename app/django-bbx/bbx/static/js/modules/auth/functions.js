/**
 * Baobaxia
 * 2014
 * 
 * auth/functions.js
 *
 *  Auth related functions
 *
 */

define([
    'jquery', 
    'lodash',
    'backbone',
    'modules/bbx/functions',
    'modules/mocambola/model',
    'text!/templates/' + BBX.userLang + '/auth/LoginOk.html',
    'text!/templates/' + BBX.userLang + '/auth/LoginFailed.html',
    'text!/templates/' + BBX.userLang + '/auth/PasswordMustMatch.html',
    'text!/templates/' + BBX.userLang + '/auth/FillUser.html',
    'text!/templates/' + BBX.userLang + '/auth/FillPassword.html',
    'text!/templates/' + BBX.userLang + '/auth/UserExists.html',
], function($, _, Backbone, BBXFunctions, MocambolaModel, LoginOkTpl, LoginFailedTpl, PasswordMustMatchTpl, FillUserTpl, FillPasswordTpl, UserExistsTpl){
    
    var init = function() {	
	AuthFunctions = this;
    }

    var __getConfig = function() {
	return BBX.config;
    }

    var __prepareLoginData = function() { 
	// TODO: add form checks
	var postData = {}
	postData.username = $("#mocambola").val();
	postData.repository = $("#repository").val();
	postData.mucua = $("#mucua").val();
	// TODO: encrypt password OR implement auth on django layer
	// - https://github.com/RedeMocambos/baobaxia/issues/24
	// while not solved, auth with no crypt
	postData.password = $("#password").val().toString();
    loginUser =  postData.username + "@" + postData.mucua + "." + postData.repository + '.net';
    // TODO: Generate according to other schemes later.
    postData.token = btoa(loginUser + ":" + postData.password);
	return postData;
    }
	
    var __checkLogin = function(loginData) {
	var url = BBX.config.apiUrl + '/' + loginData.repository + '/' + loginData.mucua + '/mocambola/login';
	//TODO: fazer check_login na API
	
	$.post(url, loginData)
	    .always(function(data) {
		data = JSON.parse(data);
		if (data.error === true) {
		    $('#message-area').html(data.errorMessage);
		    BBX.loginError = data.errorMessage;
		} else {
		    $('#message-area').html(LoginOkTpl);
		    var userData = {'username': data.username }
		    BBX.config.userData = userData;  // TODO: checar se precisa redundar as variaveis
		    localStorage.userData = JSON.stringify(userData);
		    localStorage.token = data.token;
		}		
	    });
    }
	
    var __getDefaultHome = function() {
	// MAYBE, this should be a configurable field
	var config = BBX.config,
	url = '#' + config.MYREPOSITORY + '/' + config.MYMUCUA;
	return url;
    }

    var doLogin = function(loginData) {
	var userData,
	loginData = loginData || '',
	urlRedirect = '',
	defaultUrlRedirect = BBXFunctions.getDefaultHome();
	
	if (loginData === '') {
	    loginData = __prepareLoginData();
	    __checkLogin(loginData);
	}
	
	if (typeof localStorage.redirect_url !== 'undefined') {
	    urlRedirect = localStorage.getItem('redirect_url');
	} else {
	    urlRedirect = defaultUrlRedirect;
	}
	
	//timeout nessa parte de baixo
	var loginOK = setInterval(function() {
	    var userData = {'name': 'userData',
			    'values': BBX.config.userData
			   }
	    
	    if (!_.isEmpty(userData.values)) {
		// redirect
		$('#content').html('');
		window.location.href = urlRedirect;
		clearInterval(loginOK);
	    } else if (BBX.loginError) {
		console.log('login falhou');
		BBX.loginError = false;		    
		clearInterval(loginOK);
	    }
	}, 50);
    }

    var doLogout = function() {
	delete BBX.userData;
	delete localStorage.userData;
	delete localStorage.token;
	$('#header').html('');
	$('#content').html('');
	$('#sidebar').detach();
	$('#footer').html('');
    }

    var __checkUser = function(registerData) {
	// verify if exists any user with that username
	var mocambola = null;
	
	mocambola = new MocambolaModel(registerData, 					       
				       {url: BBX.config.apiUrl + '/' + registerData.repository + '/' + registerData.mucua + '/mocambola/' + registerData.email});
	mocambola.fetch({
	    success: function() {
		// se retorna erro de usuario nao encontrado, segue. Registra usuario.
		// busca usuarios. Se retorna usuario, ele ja existe. Avisa erro de usuario existe.
		if (mocambola.attributes.error === true) {
		    // if not exists, continue and register the user
		    mocambola = new MocambolaModel(registerData, 					       
						   {url: BBX.config.apiUrl + '/mocambola/register'});
		    mocambola.save()
			.always(function(userData) {
			    if (userData.error === true) {
				$('#message-area').html(UserCreationErrorTpl);				    
			    } else {
				BBX.config.userData = userData;
				doLogin(userData);
			    }
			})		
		} else {
		    console.log('usuario ja existe. erro');
		    var message = UserExistsTpl;
		    $("#message-area").html(UserExistsTpl);
		}
	    }
	});
    }

    var doRegister = function() {
	var postData = {},
	messageArray = [];
	postData.username = $("#mocambola").val() + '@' + $("#mucua").val() + '.' + $("#repository").val() + '.net';
	postData.repository = $("#repository").val();
	postData.mucua = $("#mucua").val();
	postData.email = $("#mocambola").val() + '@' + $("#mucua").val() + '.' + $("#repository").val() + '.net';
	postData.password = $("#password").val().toString();
	postData.password2 = $("#password2").val().toString();
	
	// data check
	if (postData.password !== postData.password2) {
	    messageArray.push(PasswordMustMatchTpl);
	}
	if (postData.username === '') {
	    messageArray.push(FillUserTpl);
	}
	if (postData.password === '') {
	    messageArray.push(FillPasswordTpl);
	}
	
	if (!_.isEmpty(messageArray)) {
	    _.each(messageArray, function(message) {
		$("#message-area").append(message);
	    });
	    return false;
	} else {
	    __checkUser(postData);
	}
    }
	
    return {
	init: init,
	doLogin: doLogin,
	doLogout: doLogout,
	doRegister: doRegister
    }
});

