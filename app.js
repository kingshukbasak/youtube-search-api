
function init () {
	$(function(){
		setup();
		createScroll();
		manageScroll();
	});

	var storage_title = [], 
		storage_date = [],
		scrollElm = [],
		nextPageToken = "";

	function createScroll () {
		var i,
			limit = 7;
		for (i = 0; i < limit; i++) {
			scrollElm[i] = $('#info').clone().appendTo('#scroller');
		}
	}

	// Setting up the youtube API
	function setup () {
		gapi.client.setApiKey("AIzaSyByitsr6ZZ4webABObIce9tmArFlnIMBzw");
	    gapi.client.load("youtube", "v3", function() {
	        $('#search').on("click", function() {
				executeRequest(createRequest());
			})
	    });
	};

	function createRequest () {
		return gapi.client.youtube.search.list({
            part: "snippet",
            type: "video",
            q: encodeURIComponent($("#searchText").val()).replace(/%20/g, "+"),
            maxResults: 5,
            order: "viewCount",
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
				tempArr = [],
				snippet;

			nextPageToken = response.nextPageToken;
			for (i = 0, len = items.length; i < len; i ++) {
				snippet = items[i].snippet;
				obj = {
					title : snippet.title,
					publishedAt : new Date(snippet.publishedAt),
					thumbnail : snippet.thumbnails.default.url
				}
				tempArr.push(obj);
			}

			tempArr.sort(function(a, b) {
				return a.publishedAt < b.publishedAt;
			});

			console.log(tempArr)
       	});
	};

	function manageScroll () {

	}
};
