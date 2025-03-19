const Application = function () {
    this.initA4();
    this.tuner = new Tuner(this.a4);
    this.notes = new Notes(".notes", this.tuner);
    this.meter = new Meter(".meter");
    this.frequencyBars = new FrequencyBars(".frequency-bars");

    // Initialize note display (important!)
    this.update({
        name: "--",
        frequency: 0,
        octave: 0,
        value: 0,
        cents: 0,
    });
};

Application.prototype.initA4 = function () {
    this.$a4 = document.querySelector(".a4 span");
    this.a4 = parseInt(localStorage.getItem("a4")) || 440;
    this.$a4.innerHTML = this.a4;
};

Application.prototype.start = function () {
    const self = this;

    this.tuner.onNoteDetected = function (note) {
        if (self.notes.isAutoMode) {
            if (self.lastNote === note.name) {
                self.update(note);
            } else {
                self.lastNote = note.name;
            }
        }
    };

    swal.fire("Xin Chào Đến Với Trang Web Của Trần Cường!").then(function () {
        self.tuner.init();
        self.frequencyData = new Uint8Array(self.tuner.analyser.frequencyBinCount);
    });

    this.$a4.addEventListener("click", function () {
        swal
            .fire({ input: "number", inputValue: self.a4 })
            .then(function ({ value: a4 }) {
                if (!parseInt(a4) || a4 === self.a4) {
                    return;
                }
                self.a4 = a4;
                self.$a4.innerHTML = a4;
                self.tuner.middleA = a4;
                self.notes.createNotes();
                self.update({
                    name: "A",
                    frequency: self.a4,
                    octave: 4,
                    value: 69,
                    cents: 0,
                });
                localStorage.setItem("a4", a4);
            });
    });

    this.updateFrequencyBars();

    document.querySelector(".auto input").addEventListener("change", () => {
        this.notes.toggleAutoMode();
    });
};

Application.prototype.updateFrequencyBars = function () {
    if (this.tuner.analyser) {
        this.tuner.analyser.getByteFrequencyData(this.frequencyData);
        this.frequencyBars.update(this.frequencyData);
    }
    requestAnimationFrame(this.updateFrequencyBars.bind(this));
};

Application.prototype.update = function (note) {
    // Get the note name and frequency elements
    const noteNameElement = document.getElementById('note-name');
    const frequencyElement = document.getElementById('frequency');
    const statusElement = document.getElementById('status');

    // Update the note display
    if (noteNameElement && frequencyElement && statusElement) {
        noteNameElement.textContent = note.name;
        frequencyElement.textContent = note.frequency ? parseFloat(note.frequency).toFixed(1) + " Hz" : "-- Hz";
        // You might want to update the status element as well, based on the 'cents' value
    }
    this.notes.update(note);
    let meterOffset = 0;
    if (note.cents < 0){
      meterOffset = -1;
    }
    this.meter.update((note.cents / 50) * 1 + meterOffset);
};

const app = new Application();
app.start();