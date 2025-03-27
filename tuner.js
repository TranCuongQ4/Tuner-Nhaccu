const Tuner = function (a4) {
    this.middleA = a4 || 440;
    this.semitone = 69;
    this.bufferSize = 4096;
    this.noteStrings = [
        "C",
        "C♯",
        "D",
        "D♯",
        "E",
        "F",
        "F♯",
        "G",
        "G♯",
        "A",
        "A♯",
        "B",
    ];

    this.initGetUserMedia();
};

Tuner.prototype.initGetUserMedia = function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!window.AudioContext) {
        return alert("AudioContext not supported");
    }

    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
            const getUserMedia =
                navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!getUserMedia) {
                alert("getUserMedia is not implemented in this browser");
            }

            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        };
    }
};

Tuner.prototype.startRecord = function () {
    const self = this;
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
            const source = self.audioContext.createMediaStreamSource(stream);

            // Thêm bộ lọc khử tiếng ồn
            self.noiseFilter = self.audioContext.createBiquadFilter();
            self.noiseFilter.type = "highpass"; // Lọc tần số thấp (tiếng ồn nền)

            // Tần số cắt và độ dốc có thể cần điều chỉnh dựa trên môi trường cụ thể
            self.noiseFilter.frequency.value = 80; // Cắt tần số dưới 80Hz (điều chỉnh theo nhu cầu)
            self.noiseFilter.Q.value = 0.707; // Q = 1/sqrt(2) cho bộ lọc Butterworth (điều chỉnh theo nhu cầu)

            // Giảm gain của bộ lọc để giảm tiếng ồn (điều chỉnh theo nhu cầu)
            self.noiseFilter.gain.value = -30; // Giảm 30dB cho tần số bị lọc (điều chỉnh theo nhu cầu)

            // Kết nối source -> noiseFilter -> analyser -> scriptProcessor
            source.connect(self.noiseFilter);
            self.noiseFilter.connect(self.analyser);
            self.analyser.connect(self.scriptProcessor);
            self.scriptProcessor.connect(self.audioContext.destination);

            self.scriptProcessor.addEventListener("audioprocess", function (event) {
                const frequency = self.pitchDetector.do(
                    event.inputBuffer.getChannelData(0)
                );
                if (frequency && self.onNoteDetected) {
                    const note = self.getNote(frequency);
                    self.onNoteDetected({
                        name: self.noteStrings[note % 12],
                        value: note,
                        cents: self.getCents(frequency, note),
                        octave: parseInt(note / 12) - 1,
                        frequency: frequency,
                    });
                }
            });
        })
        .catch(function (error) {
            alert(error.name + ": " + error.message);
        });
};

Tuner.prototype.init = function () {
    this.audioContext = new window.AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.scriptProcessor = this.audioContext.createScriptProcessor(
        this.bufferSize,
        1,
        1
    );

    const self = this;

    aubio().then(function (aubio) {
        self.pitchDetector = new aubio.Pitch(
            "default",
            self.bufferSize,
            1,
            self.audioContext.sampleRate
        );
        self.startRecord();
    });
};

Tuner.prototype.getNote = function (frequency) {
    const note = 12 * (Math.log(frequency / this.middleA) / Math.log(2));
    return Math.round(note) + this.semitone;
};

Tuner.prototype.getStandardFrequency = function (note) {
    return this.middleA * Math.pow(2, (note - this.semitone) / 12);
};

Tuner.prototype.getCents = function (frequency, note) {
    const standardFrequency = this.getStandardFrequency(note);
    const cents = Math.floor(
        (1200 * Math.log(frequency / standardFrequency)) / Math.log(2)
    );
    return cents;
};

Tuner.prototype.play = function (frequency) {
    if (!this.oscillator) {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.connect(this.audioContext.destination);
        this.oscillator.start();
    }
    this.oscillator.frequency.value = frequency;
};

Tuner.prototype.stopOscillator = function () {
    if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator = null;
    }
};
