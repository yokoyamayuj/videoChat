  let peerConnection = null;

  // websocket 
  let wsUrl = 'ws://localhost:3001/';
  let ws = new WebSocket(wsUrl);

  ws.onmessage = function(evt) {
    console.log('ws onmessage() data:', evt.data);
    let message = JSON.parse(evt.data);
    if (message.type === 'offer') {
      // -- got offer ---
      console.log('Received offer ...');
      let offer = new RTCSessionDescription(message);
      setOffer(offer);
    }
    else if (message.type === 'answer') {
      // --- got answer ---
      console.log('Received answer ...');
      let answer = new RTCSessionDescription(message);
      setAnswer(answer);
    }
    else if (message.type === 'candidate') {
      // --- got ICE candidate ---
      console.log('Received ICE candidate ...');
      let candidate = new RTCIceCandidate(message.ice);
      console.log(candidate);
      addIceCandidate(candidate);
    }
  };

  function sendSdp(sessionDescription) {
    console.log('---sending sdp ---');

    let message = JSON.stringify(sessionDescription);
    console.log('sending SDP=' + message);
    ws.send(message);
  }

  function sendIceCandidate(candidate) {
    console.log('---sending ICE candidate ---');
    let obj = { type: 'candidate', ice: candidate };
    let message = JSON.stringify(obj);
    console.log('sending candidate=' + message);
    ws.send(message);
  }

  // ---------------------- connection handling -----------------------
  function prepareNewConnection() {
    let pc_config = {"iceServers":[]};
    let peer = new RTCPeerConnection(pc_config);

    // --- on get remote stream ---
    if ('ontrack' in peer) {
      peer.ontrack = function(event) {
        console.log('-- peer.ontrack()');
        let stream = event.streams[0];
        playVideo(remoteVideo, stream);
      };
    }
    else {
      peer.onaddstream = function(event) {
        console.log('-- peer.onaddstream()');
        let stream = event.stream;
        playVideo(remoteVideo, stream);
      };
    }

    // --- on get local ICE candidate
    peer.onicecandidate = function (evt) {
        sendIceCandidate(evt.candidate);
    };


    peer.oniceconnectionstatechange = function() {
      console.log('== ice connection status=' + peer.iceConnectionState);
      if (peer.iceConnectionState === 'disconnected') {
        console.log('-- disconnected --');
        hangUp();
      }
    };

    peer.onicegatheringstatechange = function() {
      console.log('==***== ice gathering state=' + peer.iceGatheringState);
    };
    
    peer.onconnectionstatechange = function() {
      console.log('==***== connection state=' + peer.connectionState);
    };

    peer.onremovestream = function(event) {
      console.log('-- peer.onremovestream()');
      pauseVideo(remoteVideo);
    };
    
    // -- add local stream --
    if (localStream) {
      console.log('Adding local stream...');
      peer.addStream(localStream);
    }
    return peer;
  }

  function makeOffer() {
    peerConnection = prepareNewConnection();
    peerConnection.createOffer()
    .then(function (sessionDescription) {
      console.log('createOffer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(function() {
      console.log('setLocalDescription() succsess in promise');

      sendSdp(peerConnection.localDescription);

    }).catch(function(err) {
      console.error(err);
    });
  }

  function setOffer(sessionDescription) {
    if (peerConnection) {
      console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareNewConnection();
    peerConnection.setRemoteDescription(sessionDescription)
    .then(function() {
      console.log('setRemoteDescription(offer) succsess in promise');
      makeAnswer();
    }).catch(function(err) {
      console.error('setRemoteDescription(offer) ERROR: ', err);
    });
  }
  
  function makeAnswer() {
    console.log('sending Answer. Creating remote session description...' );
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }
    
    peerConnection.createAnswer()
    .then(function (sessionDescription) {
      console.log('createAnswer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(function() {
      console.log('setLocalDescription() succsess in promise');

      sendSdp(peerConnection.localDescription);

    }).catch(function(err) {
      console.error(err);
    });
  }

  function setAnswer(sessionDescription) {
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }

    peerConnection.setRemoteDescription(sessionDescription)
    .then(function() {
      console.log('setRemoteDescription(answer) succsess in promise');
    }).catch(function(err) {
      console.error('setRemoteDescription(answer) ERROR: ', err);
    });
  }

  // --- tricke ICE ---
  function addIceCandidate(candidate) {
    if (peerConnection) {
      peerConnection.addIceCandidate(candidate);
    }
    else {
      console.error('PeerConnection not exist!');
      return;
    }
  }
  
  // start PeerConnection
  function connect() {
    if (! peerConnection) {
      console.log('make Offer');
      makeOffer();
    }
    else {
      console.warn('peer already exist.');
    }
  }

  // close PeerConnection
  function hangUp() {
    if (peerConnection) {
      console.log('Hang up.');
      peerConnection.close();
      peerConnection = null;
      pauseVideo(remoteVideo);
    }
    else {
      console.warn('peer NOT exist.');
    }
  }

