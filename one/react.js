// Define React components with modern UI
const { useState, useEffect, useRef } = React;

// Icon components
const IconHand = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
  </svg>
);

const IconCamera = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
);

const IconPower = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
    <line x1="12" y1="2" x2="12" y2="12"></line>
  </svg>
);

const IconInfo = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const IconX = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconCheck = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

// Main App Component
function App() {
  // Application state
  const [cameraActive, setCameraActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [ledStatus, setLedStatus] = useState(false);
  const [animateHand, setAnimateHand] = useState(false);
  const [initializingMessage, setInitializingMessage] = useState("");

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const lastLedStateRef = useRef(false);
  const requestAnimationRef = useRef(null);

  // ThingSpeak API Configuration
// Blynk API Configuration
const blynkBaseUrl = 'https://blynk.cloud/external/api/update';
const blynkToken = 'GquU8Ba9-tacHeP20if-NHixT3Pq43iz';

  // Initialize hand detection
  useEffect(() => {
    if (!cameraActive) return;

    const loadHandsModule = async () => {
      try {
        setInitializingMessage("Loading hand detection module...");
        
        // Import MediaPipe Hands dynamically
        const hands = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        
        setInitializingMessage("Configuring hand detection...");
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5
        });
        
        hands.onResults(handleHandResults);
        
        setInitializingMessage("Initializing hand tracking...");
        await hands.initialize();
        handsRef.current = hands;
        setInitializingMessage("");
        
        // Start detection loop
        detectHands();
      } catch (error) {
        console.error('Error loading hand detection:', error);
        setInitializingMessage("Error loading hand detection. Please refresh the page.");
      }
    };

    loadHandsModule();

    // Cleanup function
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, [cameraActive]);

  // Start camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
          setCameraActive(true);
          
          // Show instructions after camera starts
          setTimeout(() => {
            setShowInstructions(true);
          }, 1500);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Error accessing camera. Please ensure you have a webcam connected and have granted permission to use it.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      setHandDetected(false);
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      
      // If LED was on, turn it off
     if (lastLedStateRef.current) {
  lastLedStateRef.current = false;
  setLedStatus(false);
  sendToBlynk(0);
}
    }
  };

  // Detect hands loop
  const detectHands = async () => {
    if (handsRef.current && videoRef.current && cameraActive) {
      await handsRef.current.send({ image: videoRef.current });
    }
    
    if (cameraActive) {
      requestAnimationRef.current = requestAnimationFrame(detectHands);
    }
  };

  // Handle hand detection results
  const handleHandResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      
      // Draw hand landmarks
      const drawConnectors = window.drawConnectors;
      const drawLandmarks = window.drawLandmarks;
      const HAND_CONNECTIONS = window.HAND_CONNECTIONS;
      
      if (drawConnectors && drawLandmarks && HAND_CONNECTIONS) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#6ee7b7', lineWidth: 3 });
          drawLandmarks(ctx, landmarks, { color: '#5e7fff', lineWidth: 1, radius: 5 });
          
          // Check for two fingers up gesture
          const isTwoFingersUp = checkTwoFingersUp(landmarks);
          
          // Update LED state if it changed
         // New
if (isTwoFingersUp !== lastLedStateRef.current) {
  lastLedStateRef.current = isTwoFingersUp;
  setLedStatus(isTwoFingersUp);
  sendToBlynk(isTwoFingersUp ? 1 : 0);
  
  // Trigger hand icon animation
  if (isTwoFingersUp) {
    setAnimateHand(true);
    setTimeout(() => setAnimateHand(false), 1000);
  }
}
        }
      }
    } else {
      setHandDetected(false);
      
      // If no hand detected, turn off LED if it was on
      if (lastLedStateRef.current) {
  lastLedStateRef.current = false;
  setLedStatus(false);
  sendToBlynk(0);
}
    }
  };

  // Check if two fingers are raised upward
  const checkTwoFingersUp = (landmarks) => {
    // Get fingertip positions
    const indexTip = landmarks[8];  // Index fingertip
    const middleTip = landmarks[12]; // Middle fingertip
    const ringTip = landmarks[16];  // Ring fingertip
    const pinkyTip = landmarks[20]; // Pinky fingertip
    
    // Get base positions (knuckles)
    const indexBase = landmarks[5];  // Index base
    const middleBase = landmarks[9]; // Middle base
    const ringBase = landmarks[13];  // Ring base
    const pinkyBase = landmarks[17]; // Pinky base
    
    // Check if index and middle fingers are up (Y position of tip is less than base)
    const isIndexUp = indexTip.y < indexBase.y;
    const isMiddleUp = middleTip.y < middleBase.y;
    
    // Check if ring and pinky fingers are down (Y position of tip is greater than base)
    const isRingDown = ringTip.y > ringBase.y;
    const isPinkyDown = pinkyTip.y > pinkyBase.y;
    
    // Return true if index and middle are up while ring and pinky are down
    return isIndexUp && isMiddleUp && isRingDown && isPinkyDown;
  };

  // Send data to ThingSpeak
// Send data to Blynk
const sendToBlynk = async (value) => {
  try {
    const url = `${blynkBaseUrl}?token=${blynkToken}&v1=${value}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending data to Blynk:', error);
  }
};

  // Handle welcome screen
  const handleGetStarted = () => {
    setShowWelcome(false);
    startCamera();
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && cameraActive) {
        stopCamera();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, []);

  // Render UI
  return (
    <div className="app-container">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="modal-overlay fade-in">
          <div className="modal welcome-modal slide-up">
            <div className="welcome-icon">
              <IconHand size={40} />
            </div>
            <h2 className="welcome-title">Gesture Control Hub</h2>
            <p className="welcome-subtitle">Control IoT devices with simple hand gestures</p>
            
            <div className="feature-list">
              <div className="feature-item">
                <IconCamera className="feature-icon" />
                <p className="feature-text">Uses your webcam to detect hand gestures in real-time</p>
              </div>
              
              <div className="feature-item">
                <IconHand className="feature-icon" />
                <p className="feature-text">Raise two fingers (peace sign) to turn your IoT LED ON</p>
              </div>
              
              <div className="feature-item">
                <IconPower className="feature-icon" />
                <p className="feature-text">Lower your hand or remove it from view to turn LED OFF</p>
              </div>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={handleGetStarted}
            >
              Get Started
              <IconCheck size={20} />
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="modal-overlay fade-in">
          <div className="modal instructions-modal slide-up">
            <div className="modal-header">
              <h3 className="instructions-title">Quick Instructions</h3>
              <button 
                className="btn btn-icon"
                onClick={() => setShowInstructions(false)}
                aria-label="Close instructions"
              >
                <IconX size={18} />
              </button>
            </div>
            
            <div className="instructions-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Position Your Hand</h4>
                  <p>Make sure your hand is clearly visible in the camera frame</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Make the Peace Sign</h4>
                  <p>Raise your index and middle fingers while keeping other fingers down to turn the LED ON</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Lower Your Hand</h4>
                  <p>Lower your fingers or remove your hand from view to turn the LED OFF</p>
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowInstructions(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header>
        <div className="logo">
          <IconHand />
          <h1>Gesture Control Hub</h1>
        </div>
        
        <button 
          className="btn btn-icon"
          onClick={() => setShowInstructions(true)}
          aria-label="Show instructions"
        >
          <IconInfo size={20} />
        </button>
      </header>
      
      {/* Main content */}
      <main>
        {/* Camera View */}
        <div className="camera-view">
          <div className="camera-header">
            <div className="cam-title">
              <IconCamera size={20} />
              <span>Camera Feed</span>
            </div>
            
            <div className="cam-controls">
              {initializingMessage && (
                <div className="flex items-center">
                  <div className="loading-spinner"></div>
                  <span>{initializingMessage}</span>
                </div>
              )}
              
              <button
                className={cameraActive ? "btn btn-danger" : "btn btn-primary"}
                onClick={cameraActive ? stopCamera : startCamera}
              >
                {cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </div>
          
          <div className="camera-frame">
            {!cameraActive && (
              <div className="camera-inactive">
                <div className="camera-inactive-icon">
                  <IconCamera size={32} />
                </div>
                <p className="mb-4">Camera is currently inactive</p>
                <button
                  className="btn btn-primary"
                  onClick={startCamera}
                >
                  Start Camera
                </button>
              </div>
            )}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
            />
            <canvas ref={canvasRef} />
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="status-grid">
          {/* Camera Status */}
          <div className="status-card">
            <div className={`status-icon ${cameraActive ? 'status-active' : 'status-inactive'}`}>
              <IconCamera size={24} />
            </div>
            <h3 className="status-title">Camera</h3>
            <div className="status-indicator">
              <div className={`indicator-dot ${cameraActive ? 'dot-active' : 'dot-inactive'}`}></div>
              <span>{cameraActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          {/* Hand Detection Status */}
          <div className="status-card">
            <div className={`status-icon ${handDetected ? 'status-active' : 'status-inactive'}`}>
              <IconHand size={24} />
            </div>
            <h3 className="status-title">Hand Detection</h3>
            <div className="status-indicator">
              <div className={`indicator-dot ${handDetected ? 'dot-active' : 'dot-inactive'}`}></div>
              <span>{handDetected ? 'Hand Detected' : 'No Hand Detected'}</span>
            </div>
          </div>
          
          {/* LED Status */}
          <div className="status-card">
            <div className={`status-icon ${ledStatus ? 'status-active' : 'status-inactive'} ${animateHand ? 'pulse' : ''}`}>
              <IconPower size={24} />
            </div>
            <h3 className="status-title">IoT LED</h3>
            <div className="status-indicator">
              <div className={`indicator-dot ${ledStatus ? 'dot-active' : 'dot-inactive'}`}></div>
              <span>{ledStatus ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
        
        {/* Gesture Guide */}
        <div className="gesture-guide">
          <div className="guide-header">
            <IconHand size={22} />
            <h2 className="guide-title">Gesture Guide</h2>
          </div>
          
          <div className="guide-grid">
            <div className="gesture-card">
              <div className="gesture-header">
                <div className="gesture-emoji">✌️</div>
                <h3 className="gesture-name active">Two Fingers Up</h3>
              </div>
              <p className="gesture-desc">Raise your index and middle fingers (peace sign) while keeping other fingers down to turn the LED ON</p>
            </div>
            
            <div className="gesture-card">
              <div className="gesture-header">
                <div className="gesture-emoji">👋</div>
                <h3 className="gesture-name inactive">Hand Down</h3>
              </div>
              <p className="gesture-desc">Lower your hand or remove it from view to turn the LED OFF</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer>
        <p>A Semester 2 project by Devanarayanan A, Zanin, Anoop, and Jiyad from the Department of Robotics and Automation</p>
        
      </footer>
      
      {/* Background elements */}
      <div className="bg-elements">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-grid"></div>
      </div>
    </div>
  );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));