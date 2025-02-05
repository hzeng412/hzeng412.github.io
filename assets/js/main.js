// assets/js/main.js

document.addEventListener('DOMContentLoaded', function() {
    // Add parallax effect to geometric background
    document.addEventListener('mousemove', function(e) {
        const geometric = document.querySelector('.geometric-bg');
        if (geometric) {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            geometric.style.transform = `perspective(1000px) rotateY(${mouseX * 5}deg) rotateX(${-mouseY * 5}deg)`;
        }
    });

    // Add hover effect for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const angleX = (y - centerY) / 30;
            const angleY = (centerX - x) / 30;

            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // Add glow effect to navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('mousemove', function(e) {
            const rect = link.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            link.style.setProperty('--x', `${x}px`);
            link.style.setProperty('--y', `${y}px`);
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, h2, .three-d-container').forEach(el => {
        observer.observe(el);
    });
});