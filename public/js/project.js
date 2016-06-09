$(function(){
  'use strict';


  $.ajax({
    url: '/get-old-keys',
    method: "GET",
  }).success(function(data){
  	data.forEach(function(d){
  		$('#old-keys').append(`<div class="col-md-3 col-sm-4"><div class="old-key" data-key=${d}>${d}</div>`)
  	})
  })

  Messenger.options = {
    extraClasses: 'messenger-fixed messenger-on-top',
    theme: 'future'
  };

  var message_success = function(data){
    Messenger().post({
      message: data.message,
      type: data.type,
      hideAfter: 5
    });
  }
  var message_failure = function(data){
    Messenger().post({
      message: "FAILURE",
      type: "error",
      hideAfter: 10
    });
  }


  var reset_hits = function(){
    $(this).click(function(){
		  var data = {
		  	username: $(this).data('uname'),
		  	datatype: $(this).data('datatype'),
		  }
		  var resp = $.ajax({
		    url: '/reset',
		    method: "POST",
		    data: data,
		  })
		  .success(function(data){
		  	message_success(data);
		    setTimeout(window.location.reload.bind(window.location), 2000)
		  })
		  .fail(function(){
		  	message_failure(data);

		  })
	  })

  }
  $('button.today-hits-reset').each(reset_hits)
  $('button.yesterday-hits-reset').each(reset_hits)
  $('button.checkouts-reset').each(reset_hits)

  $('button.expire-old-keys').click(function(){
		var keys = [];
		$('.old-key').each(function(idx, datum){
			keys.push($(datum).data('key'));
		});
	  var data = {
	  	keys: keys,
	  }
	  var resp = $.ajax({
	    url: '/expire-old-keys',
	    method: "POST",
	    data: data,
	  })
	  .success(function(data){
	  	message_success(data);
	    setTimeout(window.location.reload.bind(window.location), 2000)
	  })
	  .fail(function(){
	  	message_failure(data);

	  })

	})

  $('button.expire-everything').click(function(){
	  var resp = $.ajax({
	    url: '/reset-redis',
	    method: "POST",
	  })
	  .success(function(data){
	  	message_success(data);
	    setTimeout(window.location.reload.bind(window.location), 2000)
	  })
	  .fail(function(){
	  	message_failure(data);

	  })

	})

  $('button.import-users').click(function(){
	  var resp = $.ajax({
	    url: '/import-users',
	    method: "POST",
	  })
	  .success(function(data){
	  	message_success(data);
	    setTimeout(window.location.reload.bind(window.location), 2000)
	  })
	  .fail(function(){
	  	message_failure(data);

	  })

	})


})
