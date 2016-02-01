//Example derived from code in "Learning WebRTC" by Dan Ristic


var connection = new WebSocket('ws://9.80.234.172:8888');

connection.onopen = function () 
{
  console.log("Connected");
};

connection.onmessage = function (message) 
{
  console.log("Received message", message.data);

  var data = JSON.parse(message.data);

  switch(data.type) 
  {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};

connection.onerror = function (err) 
{
  console.log("Got error", err);
};

// Alias for sending messages in JSON format
function send(message) 
{
  if (connectedUser) 
  {
    message.name = connectedUser;
  }

  connection.send(JSON.stringify(message));
};

callPage.style.display = "none";

loginButton.addEventListener("click", function (event) 
{
  name = usernameInput.value;

  if (name.length > 0) 
  {
    send({
      type: "login",
      name: name
    });
  }
});

function onLogin(success) 
{
  if (success === false) 
  {
    alert("Login unsuccessful, please try a different name.");
  } else 
  {
    loginPage.style.display = "none";
    callPage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
};

var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, connectedUser, stream;

function startConnection() 
{
  if (hasUserMedia()) 
  {
    navigator.getUserMedia({ video: true, audio: false }, function (myStream) 
    {
      stream = myStream;
      yourVideo.src = window.URL.createObjectURL(stream);

      if (hasRTCPeerConnection()) 
      {
        setupPeerConnection(stream);
      } else 
      {
        alert("Your browser does not support WebRTC.");
      }
    }, function (error) 
    {
      console.log(error);
    });
  } else 
  {
    alert("Your browser does not support WebRTC.");
  }
}

function setupPeerConnection(stream) 
{
  var configuration = 
  {
    "iceServers": [{ "url": "stun:127.0.0.1:9876" }]
  };
  yourConnection = new RTCPeerConnection(configuration);

  // Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = function (e) 
  {
    theirVideo.src = window.URL.createObjectURL(e.stream);
  };

  // Setup ice handling
  yourConnection.onicecandidate = function (event) 
  {
    if (event.candidate) 
    {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };
}

function hasUserMedia() 
{
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() 
{
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

callButton.addEventListener("click", function () 
{
  var theirUsername = theirUsernameInput.value;

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

function startPeerConnection(user) 
{
  connectedUser = user;

  // Begin the offer
  yourConnection.createOffer(function (offer) 
  {
    send({
      type: "offer",
      offer: offer
    });
    yourConnection.setLocalDescription(offer);
  }, function (error) {
    alert("An error has occurred.");
  });
};

function onOffer(offer, name) 
{
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

  yourConnection.createAnswer(function (answer) {
    yourConnection.setLocalDescription(answer);
    send({
      type: "answer",
      answer: answer
    });
  }, function (error) {
    alert("An error has occurred");
  });
};

function onAnswer(answer) 
{
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) 
{
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

hangUpButton.addEventListener("click", function () 
{
  send({
    type: "leave"
  });

  onLeave();
});

function onLeave() 
{
  connectedUser = null;
  theirVideo.src = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  setupPeerConnection(stream);
};
