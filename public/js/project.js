$(function(){
  'use strict';
  Messenger.options = {
    extraClasses: 'messenger-fixed messenger-on-top',
    theme: 'future'
  };

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
		    console.log(data);
		    Messenger().post({
		      message: data.message,
		      type: data.type,
		      hideAfter: 5
		    });
		    setTimeout(window.location.reload.bind(window.location), 2000)
		  })
		  .fail(function(){
		    Messenger().post({
		      message: "FAILURE",
		      type: "error",
		      hideAfter: 10
		    });

		  })
	  })

  }
  $('button.today-hits-reset').each(reset_hits)
  $('button.yesterday-hits-reset').each(reset_hits)
  $('button.checkouts-reset').each(reset_hits)
})
