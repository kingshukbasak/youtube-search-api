
function init () {
	$(function(){
		setup();
		manageScroll();
		createScrollableElem();
	});

	var storage_title, 
		storage_date,
		scrollElm = [],
		nextPageToken = '',
		maxVisibleItems,
		lastDrawnIndex,
		setInitialGrid = function () {
			updateGrid(0, lastDrawnIndex);
		};

	function createScrollableElem () {
		var i,
			sample = $('#info');

		scrollElm.push(sample);
		for (i = 1; i < lastDrawnIndex; i++) {
			scrollElm[i] = sample.clone();
		}
	}

	// Setting up the youtube API
	function setup () {
		$('#info')
		gapi.client.setApiKey('AIzaSyByitsr6ZZ4webABObIce9tmArFlnIMBzw');
	    gapi.client.load('youtube', 'v3', function() {
	        $('#search').on('click', function() {
	        	storage_title = [];
	        	storage_date = [];
				executeRequest(createRequest());
			});
	    });
	}

	function createRequest () {
		return gapi.client.youtube.search.list({
            part: 'snippet',
            type: 'video',
            q: encodeURIComponent($('#searchText').val()).replace(/%20/g, '+'),
            maxResults: 20,
            order: 'viewCount',
            pageToken : nextPageToken
       }); 
	}

	function executeRequest (request) {
		request.execute(function (response) {
			var result = response.result,
				items = result.items,
				i,
				obj,
				len,
				tempArrDate = [],
				tempArrTitle = [],
				snippet;

			nextPageToken = response.nextPageToken;
			for (i = 0, len = items.length; i < len; i ++) {
				snippet = items[i].snippet;
				obj = {
					title : snippet.title,
					publishedAt : new Date(snippet.publishedAt),
					thumbnail : snippet.thumbnails.default.url,
					index : i
				};
				tempArrDate.push(obj);
				tempArrTitle.push(obj);
			}

			storage_date.push(tempArrDate.sort(function (a, b) {
				return a.publishedAt < b.publishedAt;
			}));

			storage_title.push(tempArrTitle.sort(function (a, b) {
				return a.title < b.title;
			}));

			setInitialGrid && setInitialGrid();
       	});
	}

	function updateGrid (start, end) {
		var i,
			item,
			data = storage_date[0],
			datum,
			sample = $('#info');

		$('#searchContent').css("visibility", "visible");
		for (i = start; i < end; i++) {
			datum = data[i];
			if (!datum) {
				return false;
			}
			if (!(item = scrollElm[i])) {
				item = scrollElm[i] = sample.clone();
			}
			item.appendTo('#scroller');
			item.find('.pic').attr('src', datum.thumbnail);
			item.find('.title').html(datum.title);
			item.find('.date').html(datum.index);
		}
		return true;
	}

	function manageScroll () {
		var scroller = $('#scroller'),
			scrollerHeight = parseInt(scroller.css('max-height')),
			minContentHeight = parseInt($('a').css('min-height')),
			prevScrollTop = 0,
			elementScrolled,
			currentScrollTop;

		maxVisibleItems = Math.ceil(scrollerHeight / minContentHeight) + 2;
		lastDrawnIndex = maxVisibleItems + 2;
		scroller.scroll(function () {
			currentScrollTop = $(this).scrollTop();
			if (currentScrollTop > prevScrollTop) {
				elementScrolled = Math.floor((currentScrollTop - prevScrollTop) / minContentHeight);
				elementScrolled && updateGrid(lastDrawnIndex, lastDrawnIndex + 1) && lastDrawnIndex++;
			}
			elementScrolled && (prevScrollTop = currentScrollTop);
		});
	}
};
