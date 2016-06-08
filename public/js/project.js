$(function(){
    $('button.checkout-reset').each(function(){
        $(this).click(function(){
            Messenger().post({
              message: $(this).data('uname'),
              type: "error"
            })

        })
    })
})
