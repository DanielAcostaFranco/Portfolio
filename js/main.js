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

/// PROJECT DATA
const projects = [
  {
    title: "Pomodoro Timer",
    desc: "Time management app based on the Pomodoro technique, allowing users to focus in work sessions with short breaks to improve productivity.",
    tags: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/DanielAcostaFranco/Pomodoro-Timer",
    link: "https://danielacostafranco.github.io/Pomodoro-Timer/"
  },
  {
    title: "Shopping List",
    desc: "Simple and intuitive shopping list app to add, remove, and manage items dynamically using JavaScript.",
    tags: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/DanielAcostaFranco/shopping-list",
    link: "https://danielacostafranco.github.io/shopping-list/"
  },
  {
    title: "Guess My Number",
    desc: "Interactive number guessing game that provides dynamic hints and feedback based on user input.",
    tags: ["HTML", "JavaScript"],
    repo: "https://github.com/DanielAcostaFranco/GuessMyNumber",
    link: "https://danielacostafranco.github.io/GuessMyNumber/"
  },
  {
    title: "ToDo List",
    desc: "Task management app that allows users to create, track, and organize daily tasks using basic algorithms and data structures.",
    tags: ["Python", "Algorithms"],
    repo: "https://github.com/DanielAcostaFranco/todolist",
    link: "https://danielacostafranco.github.io/todolist/"
  },
  {
    title: "BYUI Project Chatbot",
    desc: "AI-powered chatbot designed to assist students with academic and administrative questions using automated responses.",
    tags: ["AI", "JavaScript", "Google Apps Script", "API"],
    repo: "https://github.com/DanielAcostaFranco/ftcchatbotwidget",
    link: "https://drive.google.com/file/d/1IYmmBdztbPERdVn_yGAZ7-O1ze12CKrk/view"
  },
  {
    title: "GoalNerd",
    desc: "Soccer statistics web platform that displays team and player data using real-time API integrations.",
    tags: ["JavaScript", "HTML"],
    repo: "https://github.com/DanielAcostaFranco/goalnerd-new-version",
    link: "https://goalnerd-soccer.netlify.app/"
  },
  {
    title: "Dahoot - Trivia Maker",
    desc: "Real-time trivia game inspired by Kahoot, built to create and play quizzes in an interactive way.",
    tags: ["C#", ".NET"],
    repo: "https://github.com/DanielAcostaFranco/cse210/tree/main/final/FinalProject",
    link: "#"
  },
  {
    title: "NextUp Web App",
    desc: "Social web application that allows users to plan, organize, and share activities with others.",
    tags: ["React", "JavaScript", "JSON"],
    repo: "https://github.com/regino-pan-a-i/NextUp",
    link: "https://nextup-4b24.onrender.com/"
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

/* ===========================
   ✅ CONTACT FORM VALIDATION (INPUT + ERRORS + HTML UPDATE)
   =========================== */

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");
    const messageInput = document.getElementById("messageInput");

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const messageError = document.getElementById("messageError");

    const successBox = document.getElementById("successBox");
    const previewBox = document.getElementById("previewBox");

    const previewName = document.getElementById("previewName");
    const previewEmail = document.getElementById("previewEmail");
    const previewMessage = document.getElementById("previewMessage");

    function showError(el, msg) {
        el.textContent = msg;
        el.classList.remove("hidden");
    }

    function hideError(el) {
        el.textContent = "";
        el.classList.add("hidden");
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        hideError(nameError);
        hideError(emailError);
        hideError(messageError);
        successBox.classList.add("hidden");
        previewBox.classList.add("hidden");

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        let hasError = false;

        if (name.length < 2) {
            showError(nameError, "Name must be at least 2 characters.");
            hasError = true;
        }

        if (!isValidEmail(email)) {
            showError(emailError, "Please enter a valid email.");
            hasError = true;
        }

        if (message.length < 10) {
            showError(messageError, "Message must be at least 10 characters.");
            hasError = true;
        }

        if (hasError) return;

        previewName.textContent = name;
        previewEmail.textContent = email;
        previewMessage.textContent = message;

        previewBox.classList.remove("hidden");
        successBox.classList.remove("hidden");
    });
}
