var primaryVideo;
var secondaryVideo;
var initialized = false;
var isPaused = true;
var trackingInterval = 200;
var trackingIntervalId = null;
var rateSyncThreshold = 0.1;
var seekSyncrateSyncThreshold = 2;
var syncing = false;

function initialize(){
	primaryVideo = document.getElementById("primaryVideo");
	secondaryVideo = document.getElementById("secondaryVideo");

	// prefer primaryVideo
	secondaryVideo.muted = true; // primaryVideo will be the audio source
	primaryVideo.onended = function(){
		secondaryVideo.pause();
	}

	var primaryVideoReady = false;
	var secondaryVideoReady = false;
	primaryVideo.oncanplay = function() {
		primaryVideoReady = true;
		if (secondaryVideoReady) {
			initialized = true;
		}
	};
	secondaryVideo.oncanplay = function() {
		secondaryVideoReady = true;
		if (primaryVideoReady) {
			initialized = true;
		}
	};
}

function togglePlayback(event){
	if (initialized){
		isPaused = !isPaused;
		if (isPaused){
			pause();
		}else{
			play();
		}
	}
}

function pause(){
	document.getElementById("playPauseBtn").innerHTML = "Play";
	primaryVideo.pause();
	secondaryVideo.pause();
	isPaused = true;
	if (trackingIntervalId){
		clearInterval(trackingIntervalId);
		trackingIntervalId = null;
	}
}

function play(){
	document.getElementById("playPauseBtn").innerHTML = "Pause";
	primaryVideo.play();
	secondaryVideo.play();
	isPaused = false;
	trackingIntervalId = setInterval(track, trackingInterval);
}

function track(){
	// update progress bar
	var currentTimePercentage = primaryVideo.currentTime / primaryVideo.duration * 100;
	document.getElementById("progress").value = currentTimePercentage;
	// update current time labels
	document.getElementById("time1").innerHTML = primaryVideo.currentTime;
	document.getElementById("time2").innerHTML = secondaryVideo.currentTime;

	//handle out of sync situation
	if (Math.abs(primaryVideo.currentTime - secondaryVideo.currentTime) > seekSyncrateSyncThreshold){
		// this requires seek, we prefer primaryVideo so secondaryVideo should seek to primaryVideo
		console.log("syncing by seek");
		secondaryVideo.currentTime = primaryVideo.currentTime;
	}else{
		// this is a minor sync issue - try to slow down or fast forward secondary video to catch up with primary video
		if (Math.abs(primaryVideo.currentTime - secondaryVideo.currentTime) > rateSyncThreshold){
			// we are out of sync - check which video should be slowed down
			syncing = true;
			console.log("starting sync by playback rate");
			if (primaryVideo.currentTime > secondaryVideo.currentTime){
				secondaryVideo.playbackRate = 1.1;
			}else{
				secondaryVideo.playbackRate = 0.9;
			}
		}else{
			// make sure playback rate is 1
			if (syncing){
				console.log("sync completed");
				secondaryVideo.playbackRate = 1;
				syncing = false;
			}
		}
	}
}

document.addEventListener("DOMContentLoaded", function(event) {
	// wait for videos to load
	initialize();

	// init play / pause button
	document.getElementById("playPauseBtn").onclick = function(event){
		togglePlayback(event);
	};

	// support seek
	document.getElementById("progress").onmousedown = function(event){
		if (initialized) {
			pause();
		}
	}
	document.getElementById("progress").onchange = function(event){
		if (initialized) {
			var seekTarget = event.currentTarget.value / 100 * primaryVideo.duration;
			primaryVideo.currentTime = seekTarget;
			secondaryVideo.currentTime = seekTarget;
			play();
		}
	}
});