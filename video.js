  let localVideo = document.getElementById('local_video');
  let remoteVideo = document.getElementById('remote_video');
  let localStream = null;

  // --- prefix -----
  navigator.getUserMedia  = navigator.getUserMedia    || navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || navigator.msGetUserMedia;
  RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;

  
  // ---------------------- media handling ----------------------- 
  // start local video
  function startVideo() {
    getDeviceStream({video: true, audio: false})
    .then(function (stream) { // success
      localStream = stream;
      playVideo(localVideo, stream);
    }).catch(function (error) { // error
      console.error('getUserMedia error:', error);
      return;
    });
  }

   // start local video
   function startScreenShare() {
    getScreenStream({video: true, audio: false})
    .then(function (stream) { // success
      localStream = stream;
      playVideo(localVideo, stream);
    }).catch(function (error) { // error
      console.error('getUserMedia error:', error);
      return;
    });
  }

  // stop local video
  function stopVideo() {
    pauseVideo(localVideo);
    stopLocalStream(localStream);
  }

  function stopLocalStream(stream) {
    let tracks = stream.getTracks();
    if (! tracks) {
      console.warn('NO tracks');
      return;
    }
    
    for (let track of tracks) {
      track.stop();
    }
  }
  
  function getDeviceStream(option) {
    if ('getUserMedia' in navigator.mediaDevices) {
      console.log('navigator.mediaDevices.getUserMadia');
      return navigator.mediaDevices.getUserMedia(option);
    }
    else {
      console.log('wrap navigator.getUserMadia with Promise');
      return new Promise(function(resolve, reject){    
        navigator.getUserMedia(option,
          resolve,
          reject
        );
      });      
    }
  }

  function getScreenStream(option) {
    if ('getDisplayMedia' in navigator.mediaDevices) {
      console.log('navigator.mediaDevices.getDisplayMedia');
      return navigator.mediaDevices.getDisplayMedia(option);
    }
    else {
      console.log('wrap navigator.getDisplayMedia with Promise');
      return new Promise(function(resolve, reject){    
        navigator.getDisplayMedia(option,
          resolve,
          reject
        );
      });      
    }
  }

  function playVideo(element, stream) {
    if ('srcObject' in element) {
      element.srcObject = stream;
    }
    else {
      element.src = window.URL.createObjectURL(stream);
    }
    element.play();
    element.volume = 3;
  }

  function pauseVideo(element) {
    element.pause();
    if ('srcObject' in element) {
      element.srcObject = null;
    }
    else {
      if (element.src && (element.src !== '') ) {
        window.URL.revokeObjectURL(element.src);
      }
      element.src = '';
    }
  }



