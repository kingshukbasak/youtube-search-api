
function init () {
	$(function(){
		setup();
		createScroll();
		manageScroll();
	});

	var storage_title, 
		storage_date,
		scrollElm = [],
		nextPageToken = '',
		updateGrid = function () {
			var i,
				len = scrollElm.length,
				item,
				data = storage_date[0];

			$('#searchContent').css("visibility", "visible");
			for (i = 0; i < len; i++) {
				item = scrollElm[i];
				item.find('.pic').attr('src', data[i].thumbnail);
				item.find('.title').html(data[i].title);
				item.find('.pic').html(data[i].publishedAt);
			}

			updateGrid = undefined;
		};

	function createScroll () {
		var i,
			limit = 5;
			sample = $('#info');

		scrollElm.push(sample);
		for (i = 1; i < limit; i++) {
			scrollElm[i] = sample.clone().appendTo('#scroller');
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
			})
	    });
	};

	function createRequest () {
		return gapi.client.youtube.search.list({
            part: 'snippet',
            type: 'video',
            q: encodeURIComponent($('#searchText').val()).replace(/%20/g, '+'),
            maxResults: 5,
            order: 'viewCount',
            pageToken : nextPageToken
       }); 
	};

	function executeRequest (request) {
		request.execute(function(response) {
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
				}
				tempArrDate.push(obj);
				tempArrTitle.push(obj);
			}

			storage_date.push(tempArrDate.sort(function(a, b) {
				return a.publishedAt < b.publishedAt;
			}));

			storage_title.push(tempArrTitle.sort(function(a, b) {
				return a.title < b.title;
			}));

			updateGrid && updateGrid();
       	});
	};

	function manageScroll () {

	}
};
