$(document).ready(function() {
  'use strict';

  var menuOpenIcon = $(".nav__icon-menu"),
    menuCloseIcon = $(".nav__icon-close"),
    menuList = $(".menu-overlay"),
    searchOpenIcon = $(".search-button"),
    searchCloseIcon = $(".search__close"),
    searchInput = $(".search__text"),
    searchBox = $(".search");


  /* =======================
  // Menu and Search
  ======================= */
  menuOpenIcon.click(function () {
    menuOpen();
  })

  menuCloseIcon.click(function () {
    menuClose();
  })

  searchOpenIcon.click(function () {
    searchOpen();
  });

  searchCloseIcon.click(function () {
    searchClose();
  });

  function menuOpen() {
    menuList.addClass("is-open");
  }

  function menuClose() {
    menuList.removeClass("is-open");
  }

  function searchOpen() {
    searchBox.addClass("is-visible");
    setTimeout(function () {
      searchInput.focus();
    }, 300);
  }

  function searchClose() {
    searchBox.removeClass("is-visible");
  }

  $('.search, .search__box').on('click keyup', function (event) {
    if (event.target == this || event.keyCode == 27) {
      $('.search').removeClass('is-visible');
    }
  });


  /* =======================
  // Animation Load Page
  ======================= */
  setTimeout(function(){
    $('body').addClass('is-in');
  },150)


  // =====================
  // Simple Jekyll Search
  // =====================
  SimpleJekyllSearch({
    searchInput: document.getElementById("js-search-input"),
    resultsContainer: document.getElementById("js-results-container"),
    json: "/search.json",
    searchResultTemplate: "<div class='article col col-4 col-d-6 col-t-12 grid__post animate'> <div class='article__inner'>{% if post.image %}<a class='article__image' href='{{post.url | prepend: site.baseurl}}'> <img src='{{site.baseurl}}{{post.image}}' alt='{{post.title}}'> </a>{% endif %}<div class='article__content'> <div class='article__meta'> <span class='article__minutes'>{% assign words=post.content | number_of_words %}{% if words < 360 %}1 min read{% else %}{{words | divided_by:180}} min read{% endif %} <time class='article__date' datetime='{{post.date | date_to_xmlschema}}'>{% assign date_format=site.minima.date_format | default: '%b %-d, %Y' %}{{post.date | date: date_format}}</time> </span> </div><h2 class='article__title'>{{post.title | escape}}</h2> <p class='article__excerpt'>{{post.description | escape}}</p><div class='article__bottom'>{% if site.author.avatar %}<div class='article__author'> <a href='{{site.baseurl}}/about/' aria-label='{{site.author.name}}'><img class='article__author-image' src='{{site.baseurl}}{{site.author.avatar}}' alt='{{site.author.name}}'s Picture'></a> </div>{% endif %}<div class='article__bottom-meta'>{% if site.author.name %}<a href='{{site.baseurl}}/about/' class='article__author-link'>{{site.author.name}}</a>{% endif %}{% if post.tags.size >=1 %}<span> in </span> <span class='article-tags'>{% for tag in post.tags %} <a href='{{site.baseurl}}/tag/{{tag}}' class='article__tag'>{{tag}}</a> {% endfor %}</span>{% endif %}</div></div></div></div></div>",
    noResultsText: '<li class="no-results"><h3>No results found</h3></li>'
   });


  /* =======================
  // LazyLoad Images
  ======================= */
  var lazyLoadInstance = new LazyLoad({
    elements_selector: '.lazy'
  })


  // =====================
  // Ajax Load More
  // =====================
  var $load_posts_button = $('.load-more-posts');

  $load_posts_button.click(function(e) {
    e.preventDefault();
    var loadMore = $('.load-more-section');
    var request_next_link = pagination_next_url.split('/page')[0] + '/page/' + pagination_next_page_number + '/';

    $.ajax({
      url: request_next_link,
      beforeSend: function() {
        $load_posts_button.text('Loading...');
      }
    }).done(function(data) {
      var posts = $('.grid__post', data);
      $('.grid').append(posts);

      var lazyLoadInstance = new LazyLoad({
        elements_selector: '.lazy'
      })

      $load_posts_button.text('Load more');
      pagination_next_page_number++;

      if (pagination_next_page_number > pagination_available_pages_number) {
        loadMore.addClass('hide');
      }
    });
  });


  /* =======================
  // Responsive Videos
  ======================= */
  $(".post__content, .page__content").fitVids({
    customSelector: ['iframe[src*="ted.com"]', 'iframe[src*="player.twitch.tv"]', 'iframe[src*="facebook.com"]']
  });


  /* =======================
  // Zoom Image
  ======================= */
  $(".page img, .post img").attr("data-action", "zoom");
  $(".page a img, .post a img").removeAttr("data-action", "zoom");


  /* =======================
  // Scroll Top Button
  ======================= */
  $(".top").click(function() {
    $("html, body")
      .stop()
      .animate({ scrollTop: 0 }, "slow", "swing");
  });
  $(window).scroll(function() {
    if ($(this).scrollTop() > $(window).height()) {
      $(".top").addClass("is-active");
    } else {
      $(".top").removeClass("is-active");
    }
  });

});