(function() {
    let hearts = [];
    const canvas = document.getElementById('heartCanvas');
    const context = canvas.getContext('2d');

    window.onresize = resizeCanvas;
    resizeCanvas();

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function render() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < hearts.length; i++) {
            const heart = hearts[i];
            context.save();
            context.globalAlpha = heart.alpha;
            context.fillStyle = heart.color;
            context.translate(heart.x, heart.y);
            context.rotate(heart.angle);
            context.scale(heart.size, heart.size);
            drawHeart(context);
            context.restore();

            heart.y -= heart.speed;
            heart.alpha -= heart.alphaDecay;
            heart.angle += heart.rotateSpeed;
            if (heart.alpha <= 0) {
                hearts.splice(i, 1);
                i--;
            }
        }
        requestAnimationFrame(render);
    }

    function drawHeart(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(-5, -15, -15, -15, -15, -5);
        ctx.bezierCurveTo(-15, 5, 0, 15, 0, 25);
        ctx.bezierCurveTo(0, 15, 15, 5, 15, -5);
        ctx.bezierCurveTo(15, -15, 5, -15, 0, -5);
        ctx.closePath();
        ctx.fill();
    }

    setInterval(() => {
        const x = Math.random() * window.innerWidth;
        const y = window.innerHeight + 50;
        createHeart(x, y, 'auto');
    }, 800);

    window.onclick = function(event) {
        createHeart(event.clientX, event.clientY, 'mouse');
    }

    window.onmousemove = function(event) {
        if (Math.random() < 0.05) {
            createHeart(event.clientX, event.clientY, 'mouse');
        }
    }

    function createHeart(x, y, type) {
        let heartColor, alphaDecay;

        if (type === 'auto') {
            heartColor = `hsla(${Math.random() * 360}, 70%, 80%, 0.6)`;
            alphaDecay = 0.003;
        } else {
            heartColor = `hsla(${Math.random() * 360}, 100%, 65%, 1)`;
            alphaDecay = 0.01;
        }

        hearts.push({
            x: x,
            y: y,
            size: Math.random() * 0.6 + 0.4,
            alpha: 1,
            angle: Math.random() * 2 * Math.PI,
            rotateSpeed: (Math.random() - 0.5) * 0.2,
            color: heartColor,
            speed: Math.random() * 1.5 + 0.5,
            alphaDecay: alphaDecay
        });
    }

    render();
})();
