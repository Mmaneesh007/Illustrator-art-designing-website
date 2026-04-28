document.addEventListener('DOMContentLoaded', () => {
    // --- Reveal Animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // --- Smooth Scroll for Nav Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // --- Elite Custom Cursor ---
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    window.addEventListener('mousemove', (e) => {
        gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1 });
        gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.3 });
    });

    const interactiveElements = document.querySelectorAll('a, button, .card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });

    // --- Case Study Data ---
    const projectData = {
        'Neo-Genesis': {
            meta: 'Environment Design / 2026',
            problem: 'Creating a city that feels alive yet mathematically perfect.',
            solution: 'Utilized fractal algorithms to architect the urban landscape.'
        },
        'Liquid Gold': {
            meta: '3D Visualization / 2026',
            problem: 'Simulating the physical properties of gold in a digital void.',
            solution: 'Developed custom shader nodes for hyper-realistic fluid dynamics.'
        },
        'Cosmic Muse': {
            meta: 'Digital Painting / 2026',
            problem: 'Representing the vastness of the universe in a human silhouette.',
            solution: 'Layered nebulous textures with hand-painted cosmic energy fields.'
        },
        'Ethereal Pulse': {
            meta: 'Conceptual Art / 2026',
            problem: 'Visualizing the "heartbeat" of an AI intelligence.',
            solution: 'Bioluminescent color palettes paired with organic digital structures.'
        },
        'Universal Mind': {
            meta: 'Vision Art / 2026',
            problem: 'The centerpiece of the CalQube brand identity.',
            solution: 'A symbolic explosion of creative data, merging the human mind with the cosmos.'
        },
        'Immersive Realities': {
            meta: 'VR Architecture / 2026',
            problem: 'Building 3D spaces that don\'t cause motion fatigue.',
            solution: 'Precision depth mapping and optimized asset geometry for high-fidelity VR.'
        },
        'Neural Processor': {
            meta: 'AI Hardware / 2026',
            problem: 'Showing the physical "soul" of an AI processor.',
            solution: 'Micro-detailed 3D modeling of neural pathways and crystalline structures.'
        }
    };

    // --- Lightbox Logic with Narrative ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const cards = document.querySelectorAll('.card');

    const nTitle = document.getElementById('narrative-title');
    const nMeta = document.getElementById('narrative-meta');
    const nProblem = document.getElementById('narrative-problem');
    const nSolution = document.getElementById('narrative-solution');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').innerText;
            const data = projectData[title] || projectData['Universal Mind'];
            
            lightboxImg.src = card.querySelector('img').src;
            nTitle.innerText = title;
            nMeta.innerText = data.meta;
            nProblem.innerText = data.problem;
            nSolution.innerText = data.solution;

            lightbox.classList.add('active');
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => { lightbox.style.opacity = '1'; }, 10);
        });
    });

    const closeLightbox = () => {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.classList.remove('active');
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 400);
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // --- Handle Parallax & Navbar with GSAP ---
    const nav = document.querySelector('nav');
    
    ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
            if (self.direction === 1) {
                nav.style.background = 'rgba(10, 10, 10, 0.8)';
                nav.style.padding = '0.75rem 2rem';
            } else {
                nav.style.background = 'rgba(255, 255, 255, 0.03)';
                nav.style.padding = '1rem 2rem';
            }
        }
    });

    if (document.querySelector('.parallax-bg')) {
        gsap.to('.parallax-bg', {
            y: (i, target) => ScrollTrigger.maxScroll(window) * 0.4,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }
});
