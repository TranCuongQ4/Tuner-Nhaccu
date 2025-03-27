/**
 * the frequency histogram
 *
 * @param {string} selector
 * @constructor
 */
const FrequencyBars = function (selector) {
    this.$canvas = document.querySelector(selector);
    if (this.$canvas) {
        this.$canvas.width = document.body.clientWidth;
        this.$canvas.height = document.body.clientHeight / 2;
        this.canvasContext = this.$canvas.getContext("2d");
    }
};

/**
 * Tạo một màu ngẫu nhiên ở định dạng hex
 */
FrequencyBars.prototype.getRandomColor = function () {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

/**
 * @param {Uint8Array} data
 */
FrequencyBars.prototype.update = function (data) {
    if (!this.canvasContext) return;

    const length = 150; // low frequency only
    const width = this.$canvas.width / length - 0.5;
    this.canvasContext.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
    for (var i = 0; i < length; i += 1) {
        this.canvasContext.fillStyle = this.getRandomColor(); // Sử dụng màu ngẫu nhiên
        this.canvasContext.fillRect(
            i * (width + 0.5),
            this.$canvas.height - data[i],
            width,
            data[i]
        );
    }
};
