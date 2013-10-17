$(function() {
	var user = {};
	var obj = {};
	var editingId;
	var searched = false;
	var searchedList = [];
	
    var app = {
        init: function() {
            this.user = {};
            $('.menu-crud').addClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.menu-loading').removeClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.btn-login').addClass('hidden');
			$('.search-input').addClass('hidden');

            $('.btn-login').attr('href', '/api/login?url=/');
            $('.btn-logout').attr('href','/api/logout?url=/');
			$('#about-link').attr('href', 'http://domzsalvador.github.io/AdvancedWebComputing/Module-one/');
			$('#about-link').attr('target', '_blank');

            this.router = new Router();
            this.setEventListeners();
            this.getUser();

            Backbone.history.start({pushState: true});
        },

        setEventListeners: function() {
            var self = this;
            $('.menu-crud .item a').click(function(ev) {
				app.clearSearch();
				
                var $el = $(ev.target).closest('.item');

                $('.menu-crud .item').removeClass('active');
                $el.addClass("active");

                if ($el.hasClass('menu-list')) {
                    self.router.navigate('list', {trigger: true});
                }

                if ($el.hasClass('menu-create')) {
                    self.router.navigate('new', {trigger: true});
                }
            });

            $('.navbar-brand').click(function() {
				app.clearSearch();
				
                self.router.navigate('', {trigger: true});
				$('.menu-create').removeClass('active');
				$('.menu-list').removeClass('active');	
            });
			
			$('form').unbind('search-input').submit(function(ev){
				searched = true;
				$('.menu-create').removeClass('active');
				$('.menu-list').removeClass('active');	
				app.router.navigate('search', {trigger: true});
				$('.thesis-list').html('');
				
				var keyword = $('.search-input').val();
				if (keyword.length == ''){
					app.loadAllThesis();
				}else{
					var thesisList = [];
					var index = 0;
					$.get('/api/thesis', function(response){
						for (var i = 0; i < response.length; i++) {
							var thesis = response[i];
							var thesisTitle = response[i].Title;
							if (thesisTitle.length >= keyword.length) {
								for (var j = 0; j <= thesisTitle.length - keyword.length; j++){
									if (thesisTitle.substring(j, j + keyword.length) == keyword) {
										thesisList[index++] = thesis;
										break;
									}
								}
							}
							
							if ($.isNumeric(keyword)){
								if (thesis.Year == keyword){
									var sameThesis = false;
									for (var j = 0; j < thesisList.length; j++) {
										if (thesis.Title == thesisList[j].Title) {
											sameThesis = true;
											break;
										}
									}
									if (!sameThesis){
										thesisList[index++] = thesis;
									}
								}
							}
						}
						searchedList = thesisList;
							app.loadSearchedThesis(thesisList);
						if (thesisList.length > 0){
							
						}else{
							alert("No search result.");
						}
					});
				}
				return false;
            });
        },
		
		loadSearchedThesis: function(list) {
			app.displayLoadedList(list);
		},
		
		clearSearch: function() {
			$('.search-input').val('');
			searched = false;
		},

        getUser: function() {
            var self = this;
            $.ajax({
                method: 'GET',
                url: '/api/users/me',
                success: function(me) {
                    console.log(me);
					user = me;
                    self.user = me;
                    self.showLogout();
                },

                error: function(err) {
                    console.log('you have not authenticated');
                    self.showLogin();
                }
            });
        },
		
        showLogin: function() {
           $('.menu-loading').addClass('hidden');
           $('.menu-user').addClass('hidden');
           $('.btn-login').removeClass('hidden');
           $('.search-input').addClass('hidden');
        },
		
        showLogout: function() {
           $('.menu-crud').removeClass('hidden');
           $('.user-email').text(this.user.email);
           $('.menu-loading').addClass('hidden');
           $('.btn-login').addClass('hidden');
           $('.menu-user').removeClass('hidden');
           $('.search-input').removeClass('hidden');
        },
		
        showHome: function() {
            $('.app-content').html('');
        },
		
        showList: function() {
            var $listTemplate = getTemplate('tpl-thesis-list');
            $('.app-content').html($listTemplate);
        },
		
        showForm: function(object) {
            if (!object) {
                object = {};
            }
			obj = object;
			
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);
			$("select option[value=" + object.Year +"]").attr("selected", "selected");
			
            $('#save-btn').click(function(){
				$.get('/api/thesis', app.save);
				return false;
			});
			
			$('#del-btn').click(function(){
				$('.menu-create').removeClass('active');
				$('.menu-list').addClass('active');
				app.deleteThesis(obj.Id);
				return false;
			});
			
			$('#cancel-btn').click(function(){
				$('.menu-list').addClass('active');
				app.router.navigate('list', {trigger: true});
			});
        },
		
		showView: function(object) {
			$('.app-content').html(getTemplate('tpl-thesis-view-item', object));
			if (typeof(FB) !== 'undefined') {
				FB.XFBML.parse();
			}else{
				fb(document, 'script', 'facebook-jssdk');
			}
			
			$('#back-btn').click(function(){
				$('.menu-list').addClass('active');
				app.router.navigate('list', {trigger: true});
			});
        },
		
        loadAllThesis: function() {
            $.get('/api/thesis', this.displayLoadedList);
            searched = false;
        },
		
        displayLoadedList: function(list) {
			for (var i = 0; i < list.length; i++){
				if (typeof(list[i].owners) !== 'undefined') {
					for (var j = 0; j < list[i].owners.length; j++){
						if (list[i].owners[j] == user.Id) {
							list[i].User = "Author"
							break;
						}
					}
				}
				$('.thesis-list').append(getTemplate('tpl-thesis-list-item', list[i]));
			}
			
			var linkClicked = 0;
			
			$('.table tbody tr #edit-link').click(function (event) {
				linkClicked = 1;
			});
			
			$('.table tbody tr #del-link').click(function (event) {
				linkClicked = 2;
			});
			
			$('.table tbody tr').click(function (event) {
				if (linkClicked == 0){
					app.router.navigate('thesis-' + $(this).attr('data-id'), {trigger: true});
					$('.menu-create').removeClass('active');
					$('.menu-list').removeClass('active');
				} else {
					app.router.navigate('edit-' + $(this).attr('data-id'), {trigger: true});
					linkClicked = 0;
					$('.menu-create').removeClass('active');
					$('.menu-list').removeClass('active');
				} //else {
					//linkClicked = 0;
					//$('.menu-create').removeClass('active');
					//$('.menu-list').addClass('active');
					//app.deleteThesis($(this).attr('data-id'));
				//}
			});
        },
		
		deleteThesis: function(id){
			$.ajax({
				type: 'DELETE',
				url: '/api/thesis/' + id,
				success: function(){
					app.router.navigate('list', {trigger: true});
				}
			});
		},
		
        save: function(allThesis) {
			var thesisObject = {};
			if ($('#save-btn').text() == "Update") {
				thesisObject.Id = editingId;
			}

			var inputs = $('form').serializeArray();
			for (var i = 0; i < inputs.length; i++) {
				thesisObject[inputs[i].name] = inputs[i].value;
			}
			
			if (thesisObject.Title.length != 0){
				var sameThesis = false;
				
				for (var i = 0; i < allThesis.length; i++){
					if (thesisObject.Title == allThesis[i].Title) {
						if ($('#save-btn').text() == "Update") {
							if (thesisObject.Id != allThesis[i].Id) {
								sameThesis = true;
							}
						} else {
							sameThesis = true;
						}
						break;
					}
				}
				
				if (sameThesis){
					alert("Thesis with this title was already created.");
				}else{
					if($.isNumeric(thesisObject.Title)){
						alert("Invalid thesis title.");
					}else{
						$.post('/api/thesis', thesisObject);
						if ($('#save-btn').text() == "Save") {
							$('.menu-create').removeClass('active');
							$('.menu-list').addClass('active');
							alert("Thesis \"" + thesisObject.Title + "\", saved.");
							app.router.navigate('list', {trigger: true});
						} else {
							var update = "";
							if (obj.Title != thesisObject.Title){
								update = "Thesis updated.\n\n     Title: \"" + obj.Title + "\" => \"" + thesisObject.Title + "\"\n";
							}
							
							if (obj.Year != thesisObject.Year){
								var thisUpdate = "     Year: \"" + obj.Year + "\" => \"" + thesisObject.Year + "\"\n";
								if (update == ""){
									update = "Thesis updated.\n\n" + thisUpdate;
								}else{
									update += thisUpdate;
								}
							}
							
							if ( obj.Subtitle != thesisObject.Subtitle){
								var thisUpdate = "     Subtitle: \"" + obj.Subtitle + "\" => \"" + thesisObject.Subtitle + "\"\n";
								if (update == ""){
									update = "Thesis updated.\n\n" + thisUpdate;
								}else{
									update += thisUpdate;
								}
							}
							
							if ( obj.Description != thesisObject.Description){
								var thisUpdate = "     Description: \"" + obj.Description + "\" => \"" + thesisObject.Description + "\"\n";
								if (update == ""){
									update = "Thesis updated.\n\n" + thisUpdate;
								}else{
									update += thisUpdate;
								}
							}
							
							if (update != ""){
								alert(update);
							}
							
							obj = thesisObject;
						}
					}
				}
			}else{
				alert("Thesis title entry is blank.");
			}
        }
    };

    function getTemplate(template_id, context) {
        var template, $template, markup;
        template = $('#' + template_id);
        $template = Handlebars.compile(template.html());
        markup = $template(context);
        return markup;

    }

    function homeView(){
        $('.sidebar-wrapper').addClass('navbar');          
        $('.navbar').addClass('navbar-inverse');
        $('.navbar').addClass('navbar-fixed-top');
        $('.navbar').removeClass('sidebar-wrapper');
        $('.container').removeClass('sidebar-nav')
        $('.app-content').removeClass('wrapper');
        $('.sidebar-brand').addClass('navbar-header');
        $('.navbar-header').removeClass('sidebar-brand');
        $('.menu-crud').addClass('nav');
        $('.menu-crud').addClass('navbar-nav');
        $('.panel-right').addClass('navbar-right');
        $('.navbar-right').addClass('navbar-nav');
        $('.navbar-right').addClass('nav');
        $('.navbar-right').removeClass('panel-right');
        $('.dropdown-menu').removeClass('dropdown-design');
        $('body').css({'padding-top': '70px'});
    }

    function contentView(){
        $('.navbar').addClass('sidebar-wrapper');          
        $('.sidebar-wrapper').removeClass('navbar-inverse');
        $('.sidebar-wrapper').removeClass('navbar-fixed-top');
        $('.sidebar-wrapper').removeClass('navbar');
        $('.container').addClass('sidebar-nav')
        $('.app-content').addClass('wrapper');
        $('.navbar-header').addClass('sidebar-brand');
        $('.sidebar-brand').removeClass('navbar-header');
        $('.menu-crud').removeClass('nav');
        $('.menu-crud').removeClass('navbar-nav');
        $('.navbar-right').addClass('panel-right');
        $('.panel-right').removeClass('nav');
        $('.panel-right').removeClass('navbar-nav');
        $('.panel-right').removeClass('navbar-right');
        $('.dropdown-menu').addClass('dropdown-design');
        $('body').css({'padding-top': '0px'});

    }

    var Router = Backbone.Router.extend({
        routes: {
            '': 'onHome',
            'thesis-:id': 'onView',
            'new': 'onCreate',
            'edit-:id': 'onEdit',
            'list': 'onList',
			'search': 'onSearch'
        },

       onHome: function() {
            homeView();
            app.showHome();
       },

       onView: function(id) {
            contentView();          
		    $.get('api/thesis/' + id, app.showView);
       },

       onCreate: function() {
            contentView();
            app.showForm();
       },

       onEdit: function(id) {
			contentView();
			editingId = id;
		    $.get('api/thesis/' + id, app.showForm);
       },

       onList: function() {
            contentView();
            app.showList();
			if (searched) {
				app.loadSearchedThesis(searchedList);
			}else{
				app.loadAllThesis();
			}
       },

       onSearch: function() {
            contentView();
            app.showList();
       }


    });
	
	function fb(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s); js.id = id;
		js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=130478947138367";
		fjs.parentNode.insertBefore(js, fjs);
	}
	
    app.init();
});