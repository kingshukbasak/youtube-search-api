
function init () {
	$(function(){
		setup();
		manageScroll();
		createScrollableElem();
	});

	var storageTitle, 
		storageDate,
		scrollElm = [],
		nextPageToken,
		maxVisibleItems,
		lastDrawIndex,
		pageNumber,	
		requestFlag,
		maxResult = 50,
		queuedEnd,
		queuedStart,
		setInitialGrid = function () {
			updateGrid(0, lastDrawIndex);
			setInitialGrid = function () {
				if (queuedStart || queuedEnd) {console.log(queuedStart, queuedEnd)
					updateGrid(queuedStart, queuedEnd + 2) && (lastDrawIndex += 3);
					queuedEnd = queuedStart = 0;
				}
			};
		};

	function createScrollableElem () {
		var i,
			sample = $('#info');

		scrollElm.push(sample);
		for (i = 1; i < lastDrawIndex; i++) {
			scrollElm[i] = sample.clone();
		}
	}

	// Setting up the youtube API
	function setup () {
		gapi.client.setApiKey('AIzaSyByitsr6ZZ4webABObIce9tmArFlnIMBzw');
	    gapi.client.load('youtube', 'v3', function() {
	        $('#search').on('click', function() {
	        	storageTitle = [];
	        	storageDate = [];
	        	pageNumber = 0;
	        	nextPageToken = '';
				executeRequest(createRequest());
			});
	    });
	}

	function createRequest () {
		return gapi.client.youtube.search.list({
            part: 'snippet',
            type: 'video',
            q: encodeURIComponent($('#searchText').val()).replace(/%20/g, '+'),
            maxResults: maxResult,
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
					thumbnail : snippet.thumbnails.default.url
				};
				tempArrDate.push(obj);
				tempArrTitle.push(obj);
			}

			storageDate.push(tempArrDate.sort(function (a, b) {
				return a.publishedAt < b.publishedAt;
			}));

			storageTitle.push(tempArrTitle.sort(function (a, b) {
				return a.title < b.title;
			}));

			setInitialGrid && setInitialGrid();
       	});
	}

	function updateGrid (start, end) {
		var i,
			item,
			pageNumber = parseInt(start / maxResult),
			data = storageDate[pageNumber],
			datum,
			sample = $('#info'),
			counter = start,
			actualStart = start % maxResult,
			actualEnd = (end % maxResult) || maxResult;
	
		$('#searchContent').css("visibility", "visible");
		for (i = actualStart; i < actualEnd; i++, counter++) {

			if (pageNumber !== parseInt(counter / maxResult)) {
				pageNumber = i % maxResult;
				data = storageDate[pageNumber];
			}

			// Response from youtube API is yet to be received so storing relevant data and recalling this function
			// on callbak. 
			if (!(data && data[i])) {
				queuedEnd = end;
				queuedStart = start;
				return;
			}

			datum = data[i];

			if (!(item = scrollElm[counter])) {
				item = scrollElm[counter] = sample.clone();
			}
			item.appendTo('#scroller');
			item.find('.pic').attr('src', datum.thumbnail);
			item.find('.title').html(datum.title);
			item.find('.date').html(datum.publishedAt);
		}

		// setting flag so that search request is not made unnecessarily
		if (actualStart === 0) {
			requestFlag = true;
		}

		// if requestFlag is set and 10% of the previous result has been queried then make a new query
		if (requestFlag && (actualStart > 0.1 * maxResult)) {
			requestFlag = false;
			executeRequest(createRequest());
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
		lastDrawIndex = maxVisibleItems + 2;
		scroller.scroll(function () {
			currentScrollTop = $(this).scrollTop();
			if (currentScrollTop > prevScrollTop) {
				elementScrolled = Math.floor((currentScrollTop - prevScrollTop) / minContentHeight);
				if (elementScrolled) {
					updateGrid(lastDrawIndex, lastDrawIndex + 1) && lastDrawIndex++;
					prevScrollTop = currentScrollTop;
				}
			}
		});
	}
}
