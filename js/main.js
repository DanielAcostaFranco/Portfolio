
AOS.init({ duration: 800, once: true });

// LOGICA DE TELEPORT FADE
function fadeToSection(e, targetId) {
    e.preventDefault();
    const body = document.body;
    const target = document.querySelector(targetId);
    body.classList.add('fade-out');
    setTimeout(() => {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'auto' });
        setTimeout(() => { body.classList.remove('fade-out'); }, 50); 
    }, 500); 
}

// LOGICA DE FONDO NEURONAL INTERACTIVO
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const mouse = { x: null, y: null, radius: 180 };

window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('resize', () => { init(); });

class Particle {
    constructor(x, y, dx, dy, size) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.size = size;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 0.4)';
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
        if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
        this.x += this.dx; this.y += this.dy;
        this.draw();
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    let particleCount = (canvas.width * canvas.height) / 10000;
    for (let i = 0; i < particleCount; i++) {
        let size = Math.random() * 1.5 + 1;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let dx = (Math.random() - 0.5) * 0.8;
        let dy = (Math.random() - 0.5) * 0.8;
        particles.push(new Particle(x, y, dx, dy, size));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => p.update());
    connect();
}

function connect() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
            let distance = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            let mDist = Math.hypot(mouse.x - particles[i].x, mouse.y - particles[i].y);

            if (distance < 120 && mDist < mouse.radius) {
                let opacity = (1 - (mDist / mouse.radius)) * (1 - (distance / 120));
                ctx.strokeStyle = `rgba(45, 212, 191, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

init();
animate();
