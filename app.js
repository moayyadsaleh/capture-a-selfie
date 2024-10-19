const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const snapButton = document.getElementById("snap");
const downloadLink = document.getElementById("download");
const downloadVideoLink = document.getElementById("downloadVideo");
const previewImage = document.getElementById("preview");
const retakeButton = document.getElementById("retake");
const countdownDisplay = document.getElementById("countdownDisplay");
const toggleCameraButton = document.getElementById("toggleCamera");
const recordVideoButton = document.getElementById("recordVideo"); // Video record button
const timerSelect = document.getElementById("timerSelect");
const context = canvas.getContext("2d");
const recordingTimer = document.getElementById("recordingTimer"); // Recording timer

let useFrontCamera = true;
let stream;
let countdown = 3;
let cameraActive = true;
let mediaRecorder;
let recordedChunks = [];
let recordingTime = 0;
let recordingInterval;

// Initialize camera with the highest available resolution (4K if available)
function initializeCamera() {
  const constraints = {
    video: {
      width: { ideal: 3840 }, // Try to request 4K resolution
      height: { ideal: 2160 },
      facingMode: useFrontCamera ? "user" : "environment",
    },
    audio: true, // Capture audio for video recording
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;

      // Set camera as active
      cameraActive = true;
      toggleCameraButton.textContent = "Turn Off Camera"; // Update button text
    })
    .catch((err) => {
      console.error("Error accessing the camera or microphone: ", err);
      fallbackToLowerResolution();
    });
}

// Fallback to lower resolution if 4K is not available
function fallbackToLowerResolution() {
  const fallbackConstraints = {
    video: {
      width: { ideal: 1920 }, // Fallback to 1080p if 4K is not available
      height: { ideal: 1080 },
      facingMode: useFrontCamera ? "user" : "environment",
    },
    audio: true,
  };

  navigator.mediaDevices
    .getUserMedia(fallbackConstraints)
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("Unable to access camera even with lower resolution", err);
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

// Capture photo with the highest resolution
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
    startRecording();
  } else {
    stopRecording();
  }
});

// Start recording video and display timer
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

  // Start the recording timer
  recordingTime = 0;
  recordingTimer.style.display = "block";
  updateRecordingTimer();
  recordingInterval = setInterval(updateRecordingTimer, 1000);
}

// Stop recording video and hide timer
function stopRecording() {
  mediaRecorder.stop();
  isRecording = false;
  recordVideoButton.innerHTML = '<i class="fas fa-video"></i>'; // Change to video icon

  // Stop the recording timer
  clearInterval(recordingInterval);
  recordingTimer.style.display = "none";
}

// Update the recording timer
function updateRecordingTimer() {
  recordingTime++;
  const minutes = Math.floor(recordingTime / 60);
  const seconds = recordingTime % 60;
  recordingTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

// Initialize camera on load with highest resolution
initializeCamera();
