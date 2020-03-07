$(document).ready(function () {
    $("#content-slider").lightSlider({
        loop: true,
        keyPress: true,
    });
    $('#image-gallery').lightSlider({
        gallery: true,
        item: 1,
        thumbItem: 9,
        slideMargin: 0,
        enableDrag: true,
        speed: 700,
        pauseOnHover: true,
        auto: true,
        loop: true,
        responsive: [
            {
                breakpoint: 800,
                settings: {
                    item: 1,
                    slideMove: 1,
                    slideMargin: 6,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    item: 1,
                }
            }
        ],
        //   prevHtml:["<img src='images/banner/arrowpre.png'>"],
        //   nextHtml:["<img src='images/banner/arrownext.png'>"],
        onSliderLoad: function () {
            $('#image-gallery').removeClass('cS-hidden');
        }
    });
    var swiper2 = new Swiper('.sub-tab-slider-2', {
        slidesPerView: 4,
        spaceBetween: 0,
        // init: false,
        autoplay:5000,
        loop: false,
      
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            1024: {
                slidesPerView: 2,
            },
            768: {
               
                slidesPerView: 2,
            },
            640: {
                autoplay: 5000,
                speed: 800,
                slidesPerView: 1,
            },
            320: {
                autoplay: 5000,
                speed: 800,
                slidesPerView: 1,
            }
        }
    });
 
    $('.owl-carousel').owlCarousel({
        loop: true,
        margin: 10,
        responsiveClass: true,
        arrows: false,
        dots: false,
        responsive: {
            0: {
                items: 2,
                nav: true
            },
            600: {
                items: 3,
                nav: false
            },
            1000: {
                items: 5,
                nav: true,
                loop: false
            }
        }
    })
    $('.galary-mb-mb').owlCarousel({
        loop: true,
        margin: 10,
        nav: true,
        // autoplay:true,
        responsive: {
            0: {
                items: 2
            },
            
            600: {
                items: 3
            },
            1000: {
                items: 5
            }
        }
    })
    
    $(".aaa").mouseover(function () {
        $(".bbb").css("opacity", 0.2);
        // $(this).css("opacity", 1);
    })
    $(".aaa").mouseleave(function () {
        $(".bbb").css("opacity", 1);
    })
 
    
    // $(".menu-toggle").click(function () {
    //     // $('menu-mb-navi').removeClass('show');
    //     $('menu-mb-navi').addClass('show');
    // });
    // $(".poi").on('mouseenter mouseleave', function () {
    //     $(this).find('.gray-overlay').fadeToggle(500);
    // });
});