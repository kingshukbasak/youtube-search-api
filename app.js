function init () {
	$(function(){
		setOrderingUI();
		setupYoutubeAPI();
		manageScroll();
		createScrollableElem();
	});

	var storage,
		scrollElm = [],
		nextPageToken,
		maxVisibleItems,
		lastDrawIndex,
		currentPageNumber,
		previousPageNumber,
		requestFlag,
		maxResult = 20,
		queuedEnd,
		queuedStart,
		prevScrollTop,
		storageKey,
		order,
		minContentHeight;

	function optionalGridUpdte () {
		if (queuedStart || queuedEnd) {
			updateGrid(queuedStart, queuedEnd + maxVisibleItems) && (lastDrawIndex += maxVisibleItems);
			queuedEnd = queuedStart = 0;
		}
	}

	function setOrderingUI () {
		$('.glyphicon').on('click', function () {
			var clickedDom = this;
			$('.glyphicon').each(function() {
				var currentItem = $(this);
				if (clickedDom === this) {
					currentItem.hasClass('active') ?
						currentItem.toggleClass('glyphicon-chevron-up glyphicon-chevron-down') : 
							currentItem.toggleClass('active');

					storageKey = this.id;
					order = currentItem.hasClass('glyphicon-chevron-up') ? 'ascending' : 'descending';
					handleDataToggling();
				}
				else {
					currentItem.removeClass('active');
				}
			});
		})
	}

	function handleDataToggling () {
		updateGrid(0, scrollElm.length, true);
	}

	function createScrollableElem () {
		var i,
			sample = $('#info');

		scrollElm.push(sample);
		for (i = 1; i < lastDrawIndex; i++) {
			scrollElm[i] = sample.clone().appendTo('#scroller');;
		}
	}

	function reset () {
		var scrollerHeight = parseInt($('#scroller').css('max-height')),
			i,
			len = scrollElm.length;

		minContentHeight = parseInt($('#info').css('min-height'));
		maxVisibleItems = Math.ceil(scrollerHeight / minContentHeight) + 2;
		lastDrawIndex = maxVisibleItems + 2;
		prevScrollTop = 0;
		storage = {
			storageTitle : [],
	    	storageDate : []
	    };
    	currentPageNumber = 0;
    	nextPageToken = '';
    	queuedStart = 0;
    	queuedEnd = 0;
    	storageKey = $('#storageDate').hasClass('active') ? 'storageDate' : 'storageTitle'

    	// Hiding all the previous search results
    	for (i = 0; i < len; i++) {
    		scrollElm[i] && scrollElm[i].hide();
    	}
	}

	// Setting up the youtube API
	function setupYoutubeAPI () {
		gapi.client.setApiKey('AIzaSyByitsr6ZZ4webABObIce9tmArFlnIMBzw');
	    gapi.client.load('youtube', 'v3', function() {
	        $('#search').on('click', function() {
	        	reset();
				executeRequest(createRequest());
				updateGrid(0, lastDrawIndex);
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

	function compare(a,b) {
		if (a.title < b.title) {
			return -1;
		}
		if (a.title > b.title){
			return 1;
		}
		return 0;
	}

	function executeRequest (request) {console.log('req')
		request.execute(function (response) {
			var result = response.result,
				items = result.items,
				i,
				obj,
				len,
				date,
				tempArrDate = [],
				tempArrTitle = [],
				snippet;

			nextPageToken = response.nextPageToken;
			for (i = 0, len = items.length; i < len; i ++) {
				snippet = items[i].snippet;
				date = new Date(snippet.publishedAt);
				obj = {
					title : snippet.title,
					publishedAt : date,
					thumbnail : snippet.thumbnails.default.url,
					modifiedDate : date.toString().match(/.+?(?=GMT)/)[0]
				};
				tempArrDate.push(obj);
				tempArrTitle.push(obj);
			}

			storage.storageDate.push(tempArrDate.sort(function (a, b) {
				return b.publishedAt - a.publishedAt;
			}));
			storage.storageTitle.push(tempArrTitle.sort(compare));

			optionalGridUpdte();
       	});
	}

	function updateGrid (start, end) {
		var i,
			item,
			calculatedMaxResult = maxResult,
			currentPageNumber = Math.floor(start / calculatedMaxResult),
			data = storage[storageKey][currentPageNumber],
			datum,
			temp,
			index,
			sample = $('#info'),
			applyColor = currentPageNumber % 2;
			index = start % calculatedMaxResult;
	
		$('#searchContent').css("visibility", "visible");
		for (i = start; i < end; i++, index++) {
			if (currentPageNumber !== (temp = Math.floor(i / calculatedMaxResult))) {
				currentPageNumber = temp;
				index = 0;
				applyColor = currentPageNumber % 2;
				data = storage[storageKey][currentPageNumber];
			}

			// Response from youtube API is yet to be received so storing relevant data and recalling this function
			// on callbak. 	
			if (!(data && data[index])) {
				queuedEnd = end;
				queuedStart = start;
				return;
			}

			datum = data[index];

			if (!(item = scrollElm[i])) {
				item = scrollElm[i] = sample.clone();
				item.appendTo('#scroller');
			}
			item.show()
			item.css('background-color', applyColor ? '#cfeef7' : '#ffffff');
			item.find('.pic').attr('src', datum.thumbnail);
			item.find('.title').html(datum.title);
			item.find('.date').html(datum.modifiedDate);

			// setting flag so that search request is not made unnecessarily
			if (index === 0) {
				requestFlag = true;
			}
		}

		// if requestFlag is set and 10% of the previous result has been queried then make a new query
		if (requestFlag && (end > 0.1 * calculatedMaxResult)) {
			requestFlag = false;
			executeRequest(createRequest());
		}
		return true;
	}

	function manageScroll () {
		var scroller = $('#scroller'),
			elementScrolled,
			currentScrollTop;

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
