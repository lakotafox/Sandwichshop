/* ========================================
   DC Veg Ordering - Anime.js Animations
   ======================================== */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavigation();
    initHeroAnimations();
    initScrollAnimations();
    initTestimonialSlider();
    initFormHandling();
    initMobileMenu();
    initCounterAnimation();
});

/* ========================================
   Loader Animation
   ======================================== */
function initLoader() {
    const loader = document.getElementById('loader');

    // Animate sandwich icon building
    const loaderTimeline = anime.timeline({
        easing: 'easeOutExpo',
        complete: () => {
            anime({
                targets: loader,
                opacity: 0,
                duration: 500,
                easing: 'easeInOutQuad',
                complete: () => {
                    loader.style.display = 'none';
                    initHeroAnimations();
                }
            });
        }
    });

    loaderTimeline
        .add({
            targets: '.bread-bottom',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 400
        })
        .add({
            targets: '.cheese',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300
        }, '-=100')
        .add({
            targets: '.tomato',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300
        }, '-=100')
        .add({
            targets: '.lettuce',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300
        }, '-=100')
        .add({
            targets: '.bread-top',
            opacity: [0, 1],
            translateY: [-30, 0],
            duration: 400
        }, '-=100')
        .add({
            targets: '.loader-text',
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 400
        }, '-=200')
        .add({
            targets: '.loader-content',
            scale: [1, 0.95],
            duration: 200
        }, '+=500');
}

/* ========================================
   Navigation
   ======================================== */
function initNavigation() {
    const nav = document.getElementById('nav');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                document.getElementById('mobileMenu').classList.remove('active');
            }
        });
    });
}

/* ========================================
   Hero Animations
   ======================================== */
function initHeroAnimations() {
    // Animate title lines
    anime({
        targets: '.title-line',
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 1000,
        delay: anime.stagger(200),
        easing: 'easeOutExpo'
    });

    // Animate subtitle
    anime({
        targets: '.hero-subtitle',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: 800,
        easing: 'easeOutExpo'
    });

    // Animate CTA buttons
    anime({
        targets: '.hero-cta',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: 1000,
        easing: 'easeOutExpo'
    });

    // Animate sandwich ingredients
    anime({
        targets: '.ingredient',
        opacity: [0, 1],
        translateY: (el, i) => [-100 + (i * 20), 0],
        delay: anime.stagger(100, {start: 1200}),
        duration: 800,
        easing: 'easeOutBounce'
    });

    // Floating animation for sandwich
    anime({
        targets: '.sandwich-display',
        translateY: [-10, 10],
        duration: 3000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
    });

    // Animate scroll indicator
    anime({
        targets: '.scroll-indicator',
        opacity: [0, 1],
        duration: 800,
        delay: 1500,
        easing: 'easeOutExpo'
    });

    // Scroll line animation
    anime({
        targets: '.scroll-line',
        scaleY: [0, 1],
        transformOrigin: 'top',
        duration: 1500,
        delay: 1800,
        easing: 'easeOutExpo',
        loop: true
    });

    // Floating shapes animation
    anime({
        targets: '.floating-shape',
        translateX: () => anime.random(-50, 50),
        translateY: () => anime.random(-50, 50),
        scale: () => anime.random(0.9, 1.1),
        duration: 8000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
    });
}

/* ========================================
   Scroll Animations
   ======================================== */
function initScrollAnimations() {
    // Create intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;

                // Feature cards
                if (element.classList.contains('feature-card')) {
                    const delay = element.dataset.delay || 0;
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateY: [30, 0],
                        duration: 800,
                        delay: parseInt(delay),
                        easing: 'easeOutExpo'
                    });
                }

                // Menu cards
                if (element.classList.contains('menu-card')) {
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateY: [40, 0],
                        duration: 800,
                        delay: parseInt(element.dataset.delay || 0),
                        easing: 'easeOutExpo'
                    });
                }

                // Section headers
                if (element.classList.contains('section-header')) {
                    anime.timeline({})
                        .add({
                            targets: element.querySelector('.section-tag'),
                            opacity: [0, 1],
                            translateY: [20, 0],
                            duration: 600,
                            easing: 'easeOutExpo'
                        })
                        .add({
                            targets: element.querySelector('.section-title'),
                            opacity: [0, 1],
                            translateY: [20, 0],
                            duration: 600,
                            easing: 'easeOutExpo'
                        }, '-=400')
                        .add({
                            targets: element.querySelector('.section-desc'),
                            opacity: [0, 1],
                            translateY: [20, 0],
                            duration: 600,
                            easing: 'easeOutExpo'
                        }, '-=400');
                }

                // About section
                if (element.classList.contains('about-content')) {
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateX: [-50, 0],
                        duration: 1000,
                        easing: 'easeOutExpo'
                    });
                }

                if (element.classList.contains('about-image')) {
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateX: [50, 0],
                        duration: 1000,
                        easing: 'easeOutExpo'
                    });
                }

                // Contact section
                if (element.classList.contains('contact-info')) {
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateX: [-30, 0],
                        duration: 800,
                        easing: 'easeOutExpo'
                    });
                }

                if (element.classList.contains('contact-form-wrapper')) {
                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateX: [30, 0],
                        duration: 800,
                        easing: 'easeOutExpo'
                    });
                }

                observer.unobserve(element);
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.feature-card, .menu-card, .section-header, .about-content, .about-image, .contact-info, .contact-form-wrapper').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Add staggered delays to menu cards
    document.querySelectorAll('.menu-card').forEach((card, index) => {
        card.dataset.delay = index * 100;
    });
}

/* ========================================
   Counter Animation
   ======================================== */
function initCounterAnimation() {
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.stat-number');

                counters.forEach(counter => {
                    const target = parseInt(counter.dataset.target);
                    const suffix = target >= 1000 ? '+' : '';

                    anime({
                        targets: counter,
                        innerHTML: [0, target],
                        round: 1,
                        duration: 2000,
                        easing: 'easeOutExpo',
                        update: function(anim) {
                            const val = Math.round(anim.animations[0].currentValue);
                            if (val >= 1000) {
                                counter.innerHTML = (val / 1000).toFixed(0) + 'K+';
                            } else {
                                counter.innerHTML = val + suffix;
                            }
                        }
                    });
                });

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

/* ========================================
   Testimonial Slider
   ======================================== */
function initTestimonialSlider() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    let currentIndex = 0;
    let autoSlide;

    function showSlide(index) {
        // Hide current
        anime({
            targets: cards[currentIndex],
            opacity: 0,
            translateX: -30,
            duration: 400,
            easing: 'easeInOutQuad',
            complete: () => {
                cards[currentIndex].classList.remove('active');
                currentIndex = index;

                // Show new
                cards[currentIndex].classList.add('active');
                anime({
                    targets: cards[currentIndex],
                    opacity: [0, 1],
                    translateX: [30, 0],
                    duration: 400,
                    easing: 'easeOutQuad'
                });
            }
        });

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        const next = (currentIndex + 1) % cards.length;
        showSlide(next);
    }

    // Click handlers for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (index !== currentIndex) {
                clearInterval(autoSlide);
                showSlide(index);
                autoSlide = setInterval(nextSlide, 5000);
            }
        });
    });

    // Auto slide
    autoSlide = setInterval(nextSlide, 5000);
}

/* ========================================
   Form Handling
   ======================================== */
function initFormHandling() {
    const form = document.getElementById('orderForm');
    const modal = document.getElementById('successModal');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Button animation
        const btn = form.querySelector('button[type="submit"]');
        anime({
            targets: btn,
            scale: [1, 0.95, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });

        // Show success modal
        setTimeout(() => {
            modal.classList.add('active');
            anime({
                targets: '.modal-content',
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutBack'
            });

            // Reset form
            form.reset();
        }, 300);
    });

    // Input focus animations
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            anime({
                targets: input.parentElement,
                scale: [1, 1.02],
                duration: 200,
                easing: 'easeOutQuad'
            });
        });

        input.addEventListener('blur', () => {
            anime({
                targets: input.parentElement,
                scale: 1,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
    });

    // Add btn hover effects
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            anime({
                targets: btn,
                scale: 1.05,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });

        btn.addEventListener('mouseleave', () => {
            anime({
                targets: btn,
                scale: 1,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });

        btn.addEventListener('click', () => {
            anime({
                targets: btn,
                scale: [1, 0.9, 1.1, 1],
                backgroundColor: ['#2D5A27', '#4A7C43'],
                color: '#fff',
                duration: 400,
                easing: 'easeInOutQuad'
            });
        });
    });
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('successModal');
    anime({
        targets: '.modal-content',
        scale: 0.8,
        opacity: 0,
        duration: 300,
        easing: 'easeInBack',
        complete: () => {
            modal.classList.remove('active');
        }
    });
}

/* ========================================
   Mobile Menu
   ======================================== */
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');

    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');

        // Animate toggle
        if (menu.classList.contains('active')) {
            anime({
                targets: toggle.querySelectorAll('span'),
                rotate: (el, i) => i === 1 ? 45 : i === 0 ? -45 : 0,
                translateY: (el, i) => i === 0 ? 8 : i === 2 ? -8 : 0,
                opacity: (el, i) => i === 1 ? 0 : 1,
                duration: 300,
                easing: 'easeInOutQuad'
            });

            anime({
                targets: '.mobile-nav-links li',
                opacity: [0, 1],
                translateX: [30, 0],
                delay: anime.stagger(100, {start: 200}),
                duration: 400,
                easing: 'easeOutQuad'
            });
        } else {
            anime({
                targets: toggle.querySelectorAll('span'),
                rotate: 0,
                translateY: 0,
                opacity: 1,
                duration: 300,
                easing: 'easeInOutQuad'
            });
        }
    });
}

/* ========================================
   Button Ripple Effect
   ======================================== */
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
        `;
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        anime({
            targets: ripple,
            width: [0, 200],
            height: [0, 200],
            opacity: [1, 0],
            duration: 600,
            easing: 'easeOutQuad',
            complete: () => ripple.remove()
        });
    });
});

/* ========================================
   Parallax Effect on Scroll
   ======================================== */
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    // Parallax for floating shapes
    document.querySelectorAll('.floating-shape').forEach((shape, index) => {
        const speed = 0.1 + (index * 0.05);
        shape.style.transform = `translateY(${scrolled * speed}px)`;
    });
});
