var common = {
    init: function () {
        common.registerEvent();
    },
    registerEvent: function () {
        $("#province").autocomplete({
            minLength: 0,
            source: function( request, response ) {
                $.ajax({
                    url: "/Catalog/ListName",
                    dataType: "json",
                    data: {
                        q: request.term
                    },
                    success: function( res ) {
                        response(res.data);
                    }
                });
            },
            focus: function (event, ui) {
                $("#province").val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                $("#province").val(ui.item.label);
                return false;
                $(this).closest('form').trigger('submit');
            }

        })
     .autocomplete("instance")._renderItem = function (ul, item) {
         return $("<li>")
           .append("<a>" + item.label + "</a>")
           .appendTo(ul);
       
     };
    }
}
common.init();