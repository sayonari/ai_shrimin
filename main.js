document.getElementById('start-button').addEventListener('click', start);
document.getElementById('stop-button').addEventListener('click', stop);

let recognition;
let audioContext;
let mediaStreamSource;
let volumeMeter;

let silenceStartTime = null;
const silenceThreshold = -40; // -40 dB
const shortSilenceDuration = 100;
const longSilenceDuration = 1500;

let playedShortSilenceAudio = true;
let playedLongSilenceAudio = true;

const shortSilenceAudioFiles = ['./wav/shrimin/bc_un.wav', './wav/shrimin/bc_unun.wav', './wav/bc_unun2.wav'];
const longSilenceAudioFiles = ['./wav/shrimin/fue-.wav', './wav/shrimin/nantonakusouomottemasita.wav', './wav/shrimin/sorekara.wav'];


function start() {
    initSpeechRecognition();
    initAudioContext();
    document.getElementById('start-button').disabled = true;
    document.getElementById('stop-button').disabled = false;
}

function stop() {
    if (recognition) {
        recognition.stop();
    }
    if (audioContext) {
        audioContext.close();
    }
    document.getElementById('start-button').disabled = false;
    document.getElementById('stop-button').disabled = true;
}

function initSpeechRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.addEventListener('result', (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        document.getElementById('recognition-result').innerText = transcript;
    });

    recognition.addEventListener('end', () => {
        if (!document.getElementById('stop-button').disabled) {
            recognition.start();
        }
    });

    recognition.start();
}

function initAudioContext() {
    audioContext = new AudioContext();
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            volumeMeter = createVolumeMeter(audioContext);
            mediaStreamSource.connect(volumeMeter);
        })
        .catch((error) => {
            console.error('Error accessing the microphone:', error);
        });
}

function createVolumeMeter(audioContext) {
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    let barWidth = 100;

    processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        let sum = 0;

        for (let i = 0; i < inputBuffer.length; i++) {
            sum += inputBuffer[i] * inputBuffer[i];
        }

        const rms = Math.sqrt(sum / inputBuffer.length);
        const volumeDb = 20 * Math.log10(rms);
        document.getElementById('volume-level').innerText = `音量: ${volumeDb.toFixed(2)} dB`;
        checkSilenceAndPlayAudio(volumeDb);
        barWidth = Math.max(0, Math.min(100, Math.round(volumeDb + 100)));
        document.getElementById('volume-bar').style.width = `${barWidth}%`;
    };

    processor.connect(audioContext.destination);

    return processor;
}

function checkSilenceAndPlayAudio(volumeDb) {
    if (volumeDb < silenceThreshold) {
        if (!silenceStartTime) {
            silenceStartTime = new Date();
        } else {
            const elapsedTime = new Date() - silenceStartTime;
            document.getElementById('pause-duration').innerText = `ポーズ継続時間 ${elapsedTime} ms`;
            if (elapsedTime >= shortSilenceDuration && elapsedTime < longSilenceDuration) {
                if (!playedShortSilenceAudio) {
                    const randomIndex = Math.floor(Math.random() * shortSilenceAudioFiles.length);
                    playAudio(shortSilenceAudioFiles[randomIndex]);
                    playedShortSilenceAudio = true;
                }
            } else if (elapsedTime >= longSilenceDuration) {
                if (!playedLongSilenceAudio) {
                    const randomIndex = Math.floor(Math.random() * longSilenceAudioFiles.length);
                    playAudio(longSilenceAudioFiles[randomIndex]);
                    playedLongSilenceAudio = true;
                }
            }
        }
    } else {
        silenceStartTime = null;
        playedShortSilenceAudio = false;
        playedLongSilenceAudio = false;
    }
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}