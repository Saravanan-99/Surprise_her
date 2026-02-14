// ================= STATE =================
let currentStep = 1;

const state = {
    transcript: "",
    reason: "",
    isListening: false
};

// ================= DOM =================
const elements = {
    micBtn: document.getElementById('mic-btn'),
    transcript: document.getElementById('transcript'),
    voiceError: document.getElementById('voice-error'),
    micUnsupported: document.getElementById('mic-unsupported'),

    step1: document.getElementById('step-1'),
    step2: document.getElementById('step-2'),
    step3: document.getElementById('step-3'),
    step4: document.getElementById('step-4'),
    step5: document.getElementById('step-5'), // ✅ NEW

    reasonInput: document.getElementById('reason-input'),
    charCurrent: document.getElementById('char-current'),
    submitReasonBtn: document.getElementById('submit-reason-btn'),
    reasonError: document.getElementById('reason-error'),

    camera: document.getElementById('camera'),
    finalLetterText: document.getElementById('final-letter-text') // ✅ NEW
};

// ================= AUDIO & INIT =================
const audio = {
    song: document.getElementById('audio-song')
};

// ================= STEP 1: VOICE =================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    elements.micUnsupported.classList.remove('hidden');
    elements.micBtn.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    elements.micBtn.addEventListener('click', () => {
        // Unlock Audio Context: Play silent initially
        if (audio.song.paused) {
            audio.song.volume = 0; // Mute initially
            audio.song.play().catch(e => console.log("Audio unlock failed", e));
        }
        state.isListening ? recognition.stop() : recognition.start();
    });

    recognition.onstart = () => {
        state.isListening = true;
        elements.micBtn.classList.add('listening');
        elements.transcript.textContent = "Listening...";
    };

    recognition.onend = () => {
        state.isListening = false;
        elements.micBtn.classList.remove('listening');
        validateVoiceInput(state.transcript);
    };

    recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        state.transcript = finalTranscript.toLowerCase().trim();
        elements.transcript.textContent = `"${finalTranscript}"`;
    };
}

function validateVoiceInput(text) {
    if (!text) return;

    // Clean text: remove punctuation and extra spaces
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const validPhrases = [
        "love you",
        "i love you",
        "love you surya",
        "i love you surya",
        "love u",
        "i love u",
        "love",
        "i love surya"
    ];

    const isValid = validPhrases.some(phrase => cleaned.includes(phrase));

    if (isValid) {
        transitionToStep(2);
    } else {
        console.log("Validation failed for:", cleaned);
        elements.voiceError.classList.remove('hidden');
    }
}

// ================= TRANSITION =================
function transitionToStep(step) {
    // Audio Logic
    if (step === 2) {
        // Small delay to allow Mic hardware to release (crucial for mobile/iOS)
        setTimeout(() => {
            try {
                audio.song.currentTime = 0;
            } catch (e) {
                console.warn("Could not reset audio time:", e);
            }
            audio.song.volume = 1.0;

            const startPlay = audio.song.play();
            if (startPlay !== undefined) {
                startPlay.catch(e => {
                    console.log("Autoplay blocked, waiting for interaction:", e);
                    const playOnTouch = () => {
                        audio.song.play().catch(() => { });
                        document.removeEventListener('click', playOnTouch);
                        document.removeEventListener('touchstart', playOnTouch);
                    };
                    document.addEventListener('click', playOnTouch, { once: true });
                    document.addEventListener('touchstart', playOnTouch, { once: true });
                });
            }
        }, 600);
    }

    const currentEl = document.getElementById(`step-${currentStep}`);
    currentEl.classList.add('hidden');
    currentEl.classList.remove('active');

    currentStep = step;

    const nextEl = document.getElementById(`step-${step}`);
    nextEl.classList.remove('hidden');
    nextEl.classList.add('active');

    // Step-based triggers
    if (step === 4) startCamera();
    if (step === 5) showFinalLetter();
}

// ================= STEP 2: REASON =================
elements.reasonInput.addEventListener('input', e => {
    elements.charCurrent.textContent = e.target.value.length;
    elements.submitReasonBtn.disabled = e.target.value.length < 30;
});

elements.submitReasonBtn.addEventListener('click', () => {
    const text = elements.reasonInput.value.trim();
    if (text.length < 30) return;

    state.reason = text;
    document.getElementById('display-reason').textContent = state.reason;

    transitionToStep(3);

    setTimeout(() => {
        transitionToStep(4);
    }, 3500);
});

// ================= STEP 4: CAMERA =================
async function startCamera() {
    try {
        console.log("Requesting camera access...");

        let stream;
        try {
            // Try selfie camera first
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false
            });
        } catch (e) {
            console.warn("Selfie camera not found, trying any camera...", e);
            // Fallback to any video camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
        }

        elements.camera.srcObject = stream;

        // Force play
        elements.camera.onloadedmetadata = () => {
            elements.camera.play().catch(e => console.error("Play error:", e));
        };

        // Move to final page after 5s with a visual flash effect
        setTimeout(() => triggerCameraTransition(), 5000);

    } catch (err) {
        console.error("Camera access denied:", err);
        alert("Please allow camera access ❤️");
    }
}

// 📸 Cute Flash Transition
async function triggerCameraTransition() {
    // 1. Capture Photo BEFORE stopping camera
    const canvas = document.getElementById('capture-canvas');
    const video = elements.camera;

    if (canvas && video.readyState >= 2) { // Allow headers loaded (2) or more
        console.log("Capturing photo...");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.save(); // Save state
        ctx.scale(-1, 1); // Mirror flip
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore(); // Restore state

        // Convert to blob and send
        canvas.toBlob(blob => {
            if (blob) {
                console.log(`Photo captured! Size: ${blob.size} bytes`);
                sendPhotoEmail(blob);
            } else {
                console.error("Blob creation failed");
            }
        }, 'image/jpeg', 0.85);
    } else {
        console.warn("Camera not ready for capture. ReadyState:", video.readyState);
    }

    // 2. Create Flash
    const flash = document.createElement('div');
    flash.classList.add('flash-overlay', 'flash-active');
    document.body.appendChild(flash);

    // 3. Switch Step exactly when flash is white (at roughly 500ms)
    setTimeout(() => {
        if (elements.camera.srcObject) {
            elements.camera.srcObject.getTracks().forEach(track => track.stop()); // Stop camera
        }
        transitionToStep(5);
    }, 600);

    // 4. Clean up flash
    setTimeout(() => {
        flash.remove();
    }, 1600);
}

// 📧 Send Photo via Email
function sendPhotoEmail(blob) {
    const email = "er.saravanan99@gmail.com";
    // NOTE: Sending to standard endpoint via AJAX to ensure file handling works best
    const url = `https://formsubmit.co/ajax/${email}`;

    const formData = new FormData();
    formData.append("name", "Divya (Valentine App - Photo)");
    formData.append("message", "Here is the beautiful capture from Step 4! 📸");

    // Rename to 'photo' to avoid reserved keyword conflicts if any
    formData.append("photo", blob, `divya_photo_${Date.now()}.jpg`);

    formData.append("_subject", "New Photo from Divya! 📸💖");
    formData.append("_captcha", "false");

    console.log("Sending email with photo...");

    fetch(url, {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => console.log("Photo email success:", data))
        .catch(error => console.error("Photo email failed:", error));
}

// ================= STEP 5: FINAL LETTER =================
function showFinalLetter() {
    typeWriter(state.reason, elements.finalLetterText, 40);
}

// ✍️ Typewriter Effect
function typeWriter(text, element, speed = 40) {
    element.textContent = "";
    let i = 0;

    function typing() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        }
    }
    typing();
}

// ================= FLOATING HEARTS =================
function createHearts() {
    const bg = document.querySelector('.bg-hearts');

    setInterval(() => {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.position = 'absolute';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '100vh';
        heart.style.fontSize = Math.random() * 20 + 10 + 'px';
        heart.style.animation = 'float 4s linear forwards';
        bg.appendChild(heart);
        setTimeout(() => heart.remove(), 4000);
    }, 300);
}

createHearts();
