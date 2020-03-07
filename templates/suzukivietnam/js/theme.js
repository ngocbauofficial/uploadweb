/* Copyright (C) YOOtheme GmbH, YOOtheme Proprietary Use License (http://www.yootheme.com/license) */

jQuery(function($) {

	var config = $('html').data('config') || {};

	// Social buttons
	$('article[data-permalink]').socialButtons(config);

    // parallax effect on elements with class .parallax
    $(".parallax").parallax();

    $(window).on('load',function() {
        // popup image map resize
        if($('map[name="image-map"]').length) {
            $("map").imageMapResize();
        }
    })

    // Calculate slants
    $(window).on('resize', (function(){
        var fn = function(){

            $('.tm-headerbar.tm-slant-bottom > .tm-slant-block-bottom:before, .tm-slant-top + .tm-block > .tm-slant-block-top, .tm-slant-bottom > .tm-slant-block-bottom').each(function(){

                var elem        = $(this),
                    slantWidth  = elem.parent().outerWidth(),
                    slantHeight = slantWidth / 100 * 2.5,
                    css         = {'border-right-width': slantWidth, 'border-top-width': slantHeight, 'top': -slantHeight+1};

                if(elem.hasClass("tm-slant-block-bottom")) {
                    css.bottom = css.top;
                    css.top    = "";
                }

                elem.css(css);

            });

            // popup image map resize
            if($('map[name="image-map"]').length) {
                $("map").imageMapResize();
            }
        };

        fn();

        return fn;

    })());

    $(document).ready(function () {
        // popup image map resize
        if($('map[name="image-map"]').length) {
            $("map").imageMapResize();
        }

        $('.promo-fix').fadeIn()
        if($('.promo-fix').length) {
            $('#close-promo').on('click', function(e) {
                $('.promo-fix').fadeOut()
                e.preventDefault()
            })
        }

        if($('.auto-append-link').length > 0) {
            var querystring = window.location.search;
            $('.auto-append-link').each(function(i) {
                var oldUrl = $(this).attr("href");
                var newUrl = oldUrl + querystring;
                $(this).attr("href", newUrl);
            })
        }

    })
    

});
