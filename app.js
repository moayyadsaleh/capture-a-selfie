const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const snapButton = document.getElementById("snap");
const downloadLink = document.getElementById("download");
const downloadVideoLink = document.getElementById("downloadVideo");
const previewImage = document.getElementById("preview");
const retakeButton = document.getElementById("retake");
const zoomControl = document.getElementById("zoomControl");
const countdownDisplay = document.getElementById("countdownDisplay");
const toggleCameraButton = document.getElementById("toggleCamera");
const recordVideoButton = document.getElementById("recordVideo");
const timerSelect = document.getElementById("timerSelect");
const context = canvas.getContext("2d");

let useFrontCamera = true;
let stream;
let countdown = 3;
let cameraActive = true;
let mediaRecorder;
let recordedChunks = [];

// Initialize camera with video and audio
function initializeCamera() {
  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: useFrontCamera ? "user" : "environment" },
      audio: true, // Request access to microphone for audio recording
    })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;

      // Handle zoom capabilities if available
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.zoom) {
        zoomControl.min = capabilities.zoom.min;
        zoomControl.max = capabilities.zoom.max;
        zoomControl.step = capabilities.zoom.step;
        zoomControl.addEventListener("input", () => {
          track.applyConstraints({ advanced: [{ zoom: zoomControl.value }] });
        });
      }

      // Set camera as active
      cameraActive = true;
      toggleCameraButton.textContent = "Turn Off Camera"; // Update button text
    })
    .catch((err) => {
      console.error("Error accessing the camera or microphone: ", err);
    });
}

// Turn off the camera and audio
function turnOffCamera() {
  const tracks = stream.getTracks();
  tracks.forEach((track) => track.stop());
  video.srcObject = null;
  cameraActive = false; // Set camera as inactive
  toggleCameraButton.textContent = "Turn On Camera"; // Update button text
}

// Toggle camera on/off based on current state
toggleCameraButton.addEventListener("click", () => {
  if (cameraActive) {
    turnOffCamera(); // Turn camera off
  } else {
    initializeCamera(); // Turn camera back on
  }
});

// Flash effect when capturing photo
function flashEffect() {
  const flash = document.createElement("div");
  flash.className = "flash";
  document.body.appendChild(flash);
  setTimeout(() => {
    flash.style.opacity = "1";
  }, 100);
  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => document.body.removeChild(flash), 500);
  }, 200);
}

// Capture photo
function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageDataUrl = canvas.toDataURL("image/png");
  previewImage.src = imageDataUrl;
  previewImage.style.display = "block";
  downloadLink.href = imageDataUrl;
  downloadLink.style.display = "block";
  retakeButton.style.display = "block";
}

// Countdown before taking the photo
function startCountdown() {
  countdown = parseInt(timerSelect.value);
  countdownDisplay.style.display = "block";
  countdownDisplay.textContent = countdown;

  const interval = setInterval(() => {
    countdown--;
    countdownDisplay.textContent = countdown;

    if (countdown === 0) {
      clearInterval(interval);
      flashEffect();
      capturePhoto();
      countdownDisplay.style.display = "none";
    }
  }, 1000);
}

// Add grayscale filter
document.getElementById("filterGrayscale").addEventListener("click", () => {
  context.filter = "grayscale(100%)";
  capturePhoto();
});

// Switch camera between front and rear
document.getElementById("switchCamera").addEventListener("click", () => {
  useFrontCamera = !useFrontCamera;
  initializeCamera();
});

// Retake photo
retakeButton.addEventListener("click", () => {
  previewImage.style.display = "none";
  downloadLink.style.display = "none";
  retakeButton.style.display = "none";
});

// Start countdown and capture
snapButton.addEventListener("click", startCountdown);

// Video recording functionality
let isRecording = false;
recordVideoButton.addEventListener("click", () => {
  if (!isRecording) {
    // Start recording
    startRecording();
  } else {
    // Stop recording
    stopRecording();
  }
});

function startRecording() {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    downloadVideoLink.href = url;
    downloadVideoLink.style.display = "block";
  };

  mediaRecorder.start();
  isRecording = true;
  recordVideoButton.innerHTML = '<i class="fas fa-stop"></i>'; // Change to stop icon
}

function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
  recordVideoButton.innerHTML = '<i class="fas fa-video"></i>'; // Change to video icon
}

// Initialize camera on load
initializeCamera();
