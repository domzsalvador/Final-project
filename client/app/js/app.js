var app = {};

$(function() {
	app = {
        init: function() {
            this.user = {};
            $('.menu-crud').addClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.menu-loading').removeClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.btn-login').addClass('hidden');

            $('.btn-login').attr('href', '/api/login?url=/');
            $('.btn-logout').attr('href','/api/logout?url=/');

            this.setEventListeners();
            this.getUser();
        },
        setEventListeners: function() {
            var self = this;
            $('.menu-crud .item a').click(function(ev) {
                var $el = $(ev.target).closest('.item');

                $('.menu-crud .item').removeClass('active');
                $el.addClass("active");

                if ($el.hasClass('menu-list')) {
                    self.showList();
                }

                if ($el.hasClass('menu-create')) {
                    self.showForm();
                }
            });
        },
        getUser: function() {
            var self = this;
            $.ajax({
                method: 'GET',
                url: '/api/users/me',
                success: function(me) {
                    // user is already signed in
                    console.log(me);
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
        },
        showLogout: function() {
           $('.menu-crud').removeClass('hidden');
           $('.user-email').text(this.user.email);
           $('.menu-loading').addClass('hidden');
           $('.btn-login').addClass('hidden');
           $('.menu-user').removeClass('hidden');
        },
        showList: function() {
            var $listTemplate = getTemplate('tpl-thesis-list');
            $('.app-content').html($listTemplate);
            this.loadAllThesis();
        },
        showForm: function(object) {
            if (!object) {
                object = {};
            }
			
            var self = this;
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);
			
			$('#enter').text('Save');
            $('form').unbind('submit').submit(function(ev) {
				$.ajax({
					method: 'GET',
					url: '/api/thesis',
					success: self.saveThesis
				});
				
                return false;
            });

        },
		saveThesis: function(response) {
			var thesisObject = {};
			var inputs = $('form').serializeArray();
			for (var i = 0; i < inputs.length; i++) {
				thesisObject[inputs[i].name] = inputs[i].value;
			}
			
			if (thesisObject.Title.length != 0){
				var sameThesis = false;
				
				for (var i = 0; i < response.length; i++){
					if (thesisObject.Title == response[i].Title){
						sameThesis = true;
						break;
					}
				}
				
				if (sameThesis){
					app.showMessage("Same title", 1000);
				}else{
					app.save(thesisObject);
				}
			}else{
				app.showMessage("Blank title", 1000);
			}
		},
		showEditForm: function(object) {
            if (!object) {
                object = {};
            }
			
            var self = this;
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);
			
			$('#enter').text('Update');

            $('form').unbind('submit').submit(function(ev) {
				$.ajax({
					method: 'GET',
					url: '/api/thesis',
					success: self.saveEditedThesis
				});
				
                return false;
            });

        },
		saveEditedThesis: function(response) {
			var thesisObject = {Id: editingId};
			var inputs = $('form').serializeArray();
			for (var i = 0; i < inputs.length; i++) {
				thesisObject[inputs[i].name] = inputs[i].value;
			}
			
			if (thesisObject.Title.length != 0){
				var sameThesis = false;
				
				for (var i = 0; i < response.length; i++){
					console.log();
					if (thesisObject.Title == response[i].Title && (thesisObject.Id != response[i].Id)){
						sameThesis = true;
						break;
					}
				}
				
				if (sameThesis){
					app.showMessage("Same title", 1000);
				}else{
					$.post('/api/thesis', thesisObject);
					
					app.showMessage("Updated", 1000);
					app.showEditForm(thesisObject);
				}
			}else{
				app.showMessage("Blank title", 1000);
			}
		},
        loadAllThesis: function() {
            $.get('/api/thesis', this.displayLoadedList);
        },
        displayLoadedList: function(list) {
            console.log('response', list);
            //  use tpl-thesis-list-item to render each loaded list and attach it
			for (var i = 0; i < list.length; i++){
				$('.thesis-list').append(getTemplate('tpl-thesis-list-item', list[i]));
			}
        },
        save: function(object) {
            var self = this;
			$.post('/api/thesis', object);
			
			self.showMessage("Saved", 1500);
			
			var $el = $('.menu-create').closest('.item');

			$('.menu-crud .item').removeClass('active');
			$el.addClass("active");

			if ($el.hasClass('menu-create')) {
				self.showForm();
			}
        },
		showMessage: function(msg, time) {
			$('.app-msg').html('<div id="msg"><hr><br>' + msg + '<br><hr><br><br></div>');
			$('#msg').animate({margin: '-300px auto auto auto'}, time);
		}
    };

    function getTemplate(template_id, context) {
        var template, $template, markup;
        template = $('#' + template_id);
        $template = Handlebars.compile(template.html());
        markup = $template(context);
        return markup;

    }
    app.init();

});

	var editingId;
	function editIt(id) {editingId = id;
		var thesisObj = {};
		$.ajax({
			method: 'GET',
			url: '/api/thesis/',
			success: function (response) {
				for (var i = 0; i < response.length; i++){
					if (id == response[i].Id){
						thesisObj = response[i];
						app.showEditForm(thesisObj);
						break;
					}
				}
			}
		});
	}