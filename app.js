function init () {
	$(function() {
		// Entry point of the application
		setupYoutubeAPI();
		setOrderingUI();
		manageScroll();
		addInitialBlocks();
	});

	// List of varibles used across all the functions
	var storage,
		scrollElm = [],
		nextPageToken,
		maxVisibleItems,
		lastDrawIndex,
		requestFlag,
		maxResult = 50,
		queuedEnd,
		queuedStart,
		prevScrollTop,
		storageKey,
		prevStorageKey,
		order,
		minContentHeight,
		luckySearch;

	/**
	 * Function which is called as a callback after the completion of request of
	 * youtube API
	 */
	function optionalGridUpdte () {
		if (queuedStart || queuedEnd) {
			updateGrid(queuedStart, queuedEnd + maxVisibleItems);
			queuedEnd = queuedStart = 0;
		}
	}

	/**
	 * Function to define the click functionality on the up and down arrows
	 * for ordering of the displayed data
	 */
	function setOrderingUI () {
		$('.glyphicon').on('click', function () {
			var clickedDom = this;
			// Iterating through all the elemets under the glyphicon class
			$('.glyphicon').each(function() {
				var currentItem = $(this);
				// When the concerened elemnet is the element that is clicked
				if (clickedDom === this) {
					currentItem.hasClass('active') ?
						currentItem.toggleClass('glyphicon-chevron-up glyphicon-chevron-down') :
							currentItem.toggleClass('active');

					storageKey = this.id;
					order = currentItem.hasClass('glyphicon-chevron-up') ? 'ascending' : 'descending';
					handleDataToggling();
				}
				else {
					currentItem.removeClass('active glyphicon-chevron-up')
						.addClass('glyphicon-chevron-down');
				}
			});
		});
	}

	/**
	 * Function to manage data ordering and sorting
	 */
	function handleDataToggling () {
		var len,
			i,
			j,
			numOfPages,
			endIndex,
			item;

		// If the key for data display is changed then just update the anchor blocks 
		// which by default happens in descending order.
		if (prevStorageKey !== storageKey) {
			updateGrid(0, scrollElm.length);
		}
		// The flow enters this block when the order of the same key against which the
		// elemnts are displayed is changed.
		else {
			len = scrollElm.length;
			numOfPages = Math.floor(len / maxResult);

			endIndex = lastDrawIndex + (maxResult - lastDrawIndex % maxResult);
			// Drawing all the scroll element of the current page
			updateGrid(lastDrawIndex, endIndex);

			function helperFN (i, j) {
				index = maxResult * j + i;
				item = scrollElm[index];
				item && item.appendTo('#scroller');
			}

			for (j = 0; j <= numOfPages; j++) {
				if (order === 'ascending') {
					for (i = maxResult - 1; i >= 0; i--) {
						helperFN(i, j);
					}
				}
				else {
					for (i = 0; i < maxResult; i++) {
						helperFN(i, j);
					}
				}
			}
		}
		prevStorageKey = storageKey;
	}

	/**
	 * Function for creating the initial scrollable anchor blocks.
	 */
	function addInitialBlocks () {
		var i,
			sample = $('#info');
			sample.hide();

		// Creating 2 extra blocks than the calculated maximum visible blocks
		for (i = 0; i < maxVisibleItems + 2; i++) {
			scrollElm[i] = sample.clone(true);
		}
	}

	/**
	 * Function to reset all the paramters every time a new query is searched
	 */
	function reset () {
		var scrollerHeight = parseInt($('#scroller').css('max-height')),
			i,
			len = scrollElm.length;

		minContentHeight = parseInt($('#info').css('min-height'));
		maxVisibleItems = Math.ceil(scrollerHeight / minContentHeight) + 2;
		lastDrawIndex = 0;
		prevScrollTop = 0;
		storage = {
			storageTitle : [],
	    	storageDate : []
	    };
    	currentPageNumber = 0;
    	nextPageToken = '';
    	queuedStart = 0;
    	queuedEnd = 0;
    	order = undefined;
    	
    	// Setting the toggling class properly
    	$('#storageDate').addClass('active glyphicon-chevron-down').removeClass('glyphicon-chevron-up');
    	$('#storageTitle').addClass('glyphicon-chevron-down').removeClass('glyphicon-chevron-up active');

    	prevStorageKey = storageKey = $('#storageDate').hasClass('active') ? 'storageDate' : 'storageTitle';

    	$('#iframe').attr('src','');

    	// Hiding all the previous search results
    	for (i = 0; i < len; i++) {
    		scrollElm[i] && scrollElm[i].hide();
    	}
	}

	/**
	 * Function to instantiate the youtube API and add eventListeners to the page.
	 */
	function setupYoutubeAPI () {
		gapi.client.setApiKey('AIzaSyByitsr6ZZ4webABObIce9tmArFlnIMBzw');
	    gapi.client.load('youtube', 'v3', function() {
	        $('#search').on('click', function() {
	        	reset();
				executeRequest(createRequest());
				updateGrid(0, maxVisibleItems + 2);
			});

	        $('a').on('click', function(e) {
	        	$('iframe')[0].src = 'https://www.youtube.com/embed/' + $(this).data('videoId') +
					'?autoplay=1';
	        });

	        $('#luckySearch').on('click', function () {
	        	$('#search').click();
	        	luckySearch = true;
	        });
	    });
	}

	/**
	 * Function to create the youtube API request object where the result is ordered by viewCount
	 */
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

	/**
	 * Function for sorting an array of objects based on a string
	 * @param  {Object} a An object of the array
	 * @param  {Object} b An object of the array
	 */
	function compare (a,b) {
		if (a.title < b.title) {
			return 1;
		}
		if (a.title > b.title){
			return -1;
		}
		return 0;
	}

	/**
	 * Function to execute the previously formed youtube request object
	 * @param  {Object} request The youtube API request object
	 */
	function executeRequest (request) {
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

			// Storring the nextPageToken token for future query.
			nextPageToken = response.nextPageToken;

			// Parsing the result obtained into usable format
			for (i = 0, len = items.length; i < len; i ++) {
				snippet = items[i].snippet;
				date = new Date(snippet.publishedAt);
				obj = {
					title : snippet.title,
					publishedAt : date,
					thumbnail : snippet.thumbnails.default.url,
					modifiedDate : date.toString().match(/.+?(?=GMT)/)[0],
					videoId : items[i].id.videoId
				};
				tempArrDate.push(obj);
				tempArrTitle.push(obj);
			}

			// Sorting the stored data as per the date the video is published
			storage.storageDate.push(tempArrDate.sort(function (a, b) {
				return b.publishedAt - a.publishedAt;
			}));

			// Sorting the stored data as per the title of the video
			storage.storageTitle.push(tempArrTitle.sort(compare));

			optionalGridUpdte();

			// If 'i'm lucky' button is pressed, following code is executed.
			if (luckySearch) {
				$('#iframe')[0].src = 'https://www.youtube.com/embed/' + $(scrollElm[0]).data('videoId') +
					'?autoplay=1';
				luckySearch = false;
			}
       	});
	}

	/**
	 * Fucntion to continuously expand the grid on demand by adding new clickable anchor elements
	 * @param  {Number} start Index from where clickable elemets has to be added.
	 * @param  {Number} end   Index upto which clickable elemets has to be added.
	 */
	function updateGrid (start, end) {
		var i,
			item,
			currentPageNumber = Math.floor(start / maxResult),
			data = storage[storageKey][currentPageNumber],
			datum,
			temp,
			index,
			sample = $('#info'),
			applyColor = currentPageNumber % 2;
			index = start % maxResult;
	
		$('#searchContent').css('visibility', 'visible');
		for (i = start; i < end; i++, index++) {
			if (currentPageNumber !== (temp = Math.floor(i / maxResult))) {
				currentPageNumber = temp;
				index = 0;
				applyColor = currentPageNumber % 2;
				data = storage[storageKey][currentPageNumber];
			}

			// Response from youtube API is yet to be received so storing relevant data
			// which is used during the callback execution of youtube API
			if (!(data && data[index])) {
				queuedEnd = end;
				queuedStart = start;
				return;
			}

			datum = data[index];

			if (!(item = scrollElm[i])) {
				item = scrollElm[i] = sample.clone(true);
			}

			// Setting all the relevant properties to the clickable blocks
			item.appendTo('#scroller');
			item.data('videoId', datum.videoId);
			item.show();
			item.css('background-color', applyColor ? '#cfeef7' : '#ffffff');
			item.find('.pic').attr('src', datum.thumbnail);
			item.find('.title').html(datum.title);
			item.find('.date').html(datum.modifiedDate);

			// setting flag so that search request is not made unnecessarily
			if (index === 0) {
				requestFlag = true;
			}
			lastDrawIndex++;
		}

		// if requestFlag is set and 10% of the previous result has been queried then make a new query
		if (requestFlag && (end > 0.1 * maxResult)) {
			requestFlag = false;
			executeRequest(createRequest());
		}
	}

	/**
	 * Function to update the visuals when the grid is scrolled.
	 */
	function manageScroll () {
		var scroller = $('#scroller'),
			elementScrolled,
			currentScrollTop;

		scroller.scroll(function () {
			currentScrollTop = $(this).scrollTop();
			if (currentScrollTop > prevScrollTop) {
				elementScrolled = Math.floor((currentScrollTop - prevScrollTop) / minContentHeight);
				// If a complete block is scrolled up only then call the updateGrid function
				if (elementScrolled) {
					updateGrid(lastDrawIndex, lastDrawIndex + 1);
					prevScrollTop = currentScrollTop;
				}
			}
		});
	}
}
