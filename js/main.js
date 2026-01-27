AOS.init({ duration: 800, once: true });

// TELEPORT FADE
function fadeToSection(e, targetId) {
    e.preventDefault();
    const body = document.body;
    const target = document.querySelector(targetId);
    body.classList.add('fade-out');
    setTimeout(() => {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'auto' });
        setTimeout(() => body.classList.remove('fade-out'), 50);
    }, 500);
}

// PROJECT DATA
const projects = [
    {
        title: "GoalNerd",
        desc: "Soccer statistics platform integrated with real-time data APIs.",
        tags: ["JavaScript", "HTML"],
        repo: "https://github.com/DanielAcostaFranco/goalnerd-new-version",
        link: "https://goalnerd-soccer.netlify.app/"
    },
    {
        title: "NextUp Web App",
        desc: "Social platform for planning and sharing experiences.",
        tags: ["React", "JavaScript", "JSON"],
        repo: "https://github.com/regino-pan-a-i/NextUp",
        link: "https://nextup-4b24.onrender.com/"
    },
    {
        title: "Guess My Number",
        desc: "Interactive logic game with dynamic number hints.",
        tags: ["HTML", "JavaScript"],
        repo: "https://github.com/DanielAcostaFranco/GuessMyNumber",
        link: "https://danielacostafranco.github.io/GuessMyNumber/"
    },
    {
        title: "BYUI Project Chabot",
        desc: "AI assistant providing academic and administrative student support.",
        tags: ["AI", "JavaScript", "Google Apps Script", "API"],
        repo: "https://github.com/DanielAcostaFranco/ftcchatbotwidget",
        link: "https://drive.google.com/file/d/1IYmmBdztbPERdVn_yGAZ7-O1ze12CKrk/view"
    },
    {
        title: "ToDo List",
        desc: "Productivity tool for organizing and tracking daily tasks.",
        tags: ["Python", "Algorithms"],
        repo: "https://github.com/DanielAcostaFranco/todolist",
        link: "https://danielacostafranco.github.io/todolist/"
    },
    {
        title: "Dahoot - Trivia Maker",
        desc: "Gamified trivia platform for interactive real-time learning.",
        tags: ["C#", ".NET"],
        repo: "https://github.com/DanielAcostaFranco/cse210/tree/main/final/FinalProject",
        link: "#"
    }
];

const container = document.getElementById("projects-container");

projects.forEach((p, i) => {
    container.innerHTML += `
        <div class="project-card rounded-xl overflow-hidden" data-aos="fade-up" data-aos-delay="${i * 100}">
            <div class="terminal-header">
                <div class="dot bg-red-500/30"></div>
                <div class="dot bg-yellow-500/30"></div>
                <div class="dot bg-green-500/30"></div>
            </div>
            <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                    <i class="far fa-folder-open text-4xl text-cyan-400/60"></i>
                    <div class="space-x-4 text-slate-500 text-xl">
                        <a href="${p.repo}" target="_blank"><i class="fab fa-github"></i></a>
                        <a href="${p.link}" target="_blank"><i class="fas fa-external-link-alt"></i></a>
                    </div>
                </div>
                <h4 class="text-xl font-bold text-slate-100 mb-3">${p.title}</h4>
                <p class="text-slate-400 text-sm mb-6">${p.desc}</p>
                <div class="flex flex-wrap gap-2">
                    ${p.tags.map(tag => `<span class="text-[10px] text-cyan-400/80 bg-cyan-400/5 px-2 py-1 rounded border border-cyan-400/20">${tag}</span>`).join("")}
                </div>
            </div>
        </div>
    `;
});

// NEURAL BACKGROUND
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const mouse = { x: null, y: null, radius: 180 };

window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('resize', init);

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
        if (this.x > canvas.width || this.x < 0) this.dx *= -1;
        if (this.y > canvas.height || this.y < 0) this.dy *= -1;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

function init() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    particles = [];
    const count = (canvas.width * canvas.height) / 10000;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            Math.random() * 1.5 + 1
        ));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => p.update());
}

init();
animate();
