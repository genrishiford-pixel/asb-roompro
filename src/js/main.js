/* ========================================
   АСБ РУМ ПРО - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // 1. PRELOADER
    // ========================================
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Initialize animations after preloader
            initAnimations();
        }, 300);
    } else {
        initAnimations();
    }

    // ========================================
    // 2. NAVIGATION
    // ========================================
    const nav = document.querySelector('.nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // ========================================
    // 3. SMOOTH SCROLL
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ========================================
    // 4. STATS COUNTER ANIMATION
    // ========================================
    function animateCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const suffix = stat.getAttribute('data-suffix') || '';
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    stat.textContent = target + suffix;
                    clearInterval(counter);
                } else {
                    stat.textContent = Math.floor(current) + suffix;
                }
            }, 16);
        });
    }

    // ========================================
    // 5. CALCULATOR
    // ========================================
    const calculator = document.querySelector('.calculator-wrapper');
    if (calculator) {
        const typeOptions = document.querySelectorAll('.calc-option[data-type]');
        const finishOptions = document.querySelectorAll('.calc-option[data-finish]');
        const rangeSlider = document.querySelector('.range-slider');
        const rangeValue = document.querySelector('.range-value');
        const resultValue = document.querySelector('.calc-result-value');

        let selectedType = ' квартира';
        let selectedFinish = 'стандарт';
        let currentValue = 100;

        // Price per m²
        const prices = {
            ' дом': 15000,
            ' квартира': 12000,
            ' коммерция': 18000,
            ' ремонт': 8000
        };

        // Finish multipliers
        const multipliers = {
            'эконом': 1,
            'стандарт': 1.5,
            'премиум': 2.5
        };

        // Type selection
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                typeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedType = option.getAttribute('data-type');
                calculatePrice();
            });
        });

        // Finish selection
        finishOptions.forEach(option => {
            option.addEventListener('click', () => {
                finishOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedFinish = option.getAttribute('data-finish');
                calculatePrice();
            });
        });

        // Range slider
        if (rangeSlider && rangeValue) {
            rangeSlider.addEventListener('input', (e) => {
                currentValue = parseInt(e.target.value);
                rangeValue.textContent = currentValue + ' м²';
                calculatePrice();
            });
        }

        function calculatePrice() {
            if (resultValue) {
                const pricePerSqm = prices[selectedType] || 12000;
                const multiplier = multipliers[selectedFinish] || 1;
                const total = Math.round(currentValue * pricePerSqm * multiplier);
                resultValue.textContent = total.toLocaleString('ru-RU') + ' ₽';
            }
        }

        // Initialize
        typeOptions[1].classList.add('active');
        finishOptions[1].classList.add('active');
    }

    // ========================================
    // 6. REVIEWS SLIDER
    // ========================================
    const reviewsSlider = document.querySelector('.reviews-track');
    const reviewDots = document.querySelectorAll('.review-dot');
    const reviewArrows = document.querySelectorAll('.review-arrow');
    
    let currentSlide = 0;
    const totalSlides = reviewDots.length;

    function goToSlide(index) {
        currentSlide = index;
        if (reviewsSlider) {
            reviewsSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        reviewDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    reviewDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    reviewArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const direction = arrow.getAttribute('data-direction');
            let newIndex = currentSlide;
            
            if (direction === 'prev') {
                newIndex = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1;
            } else {
                newIndex = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
            }
            
            goToSlide(newIndex);
        });
    });

    // Auto-rotate reviews
    setInterval(() => {
        if (totalSlides > 1) {
            const nextSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
            goToSlide(nextSlide);
        }
    }, 5000);

    // ========================================
    // 7. FORM SUBMISSION
    // ========================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('https://formspree.io/f/mlgwvgkv', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
                    contactForm.reset();
                } else {
                    alert('Ошибка отправки. Пожалуйста, попробуйте позже.');
                }
            } catch (error) {
                alert('Ошибка отправки. Пожалуйста, попробуйте позже.');
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // ========================================
    // GSAP ANIMATIONS
    // ========================================
    function initAnimations() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // Hero content animation
            gsap.to('.hero-content', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.3,
                ease: 'power3.out'
            });

            // Stats animation
            gsap.to('.stat-item', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                scrollTrigger: {
                    trigger: '.stats',
                    start: 'top 80%'
                }
            });

            // Services animation
            gsap.to('.service-card', {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.services',
                    start: 'top 75%'
                }
            });

            // Calculator animation
            gsap.to('.calc-step', {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.15,
                scrollTrigger: {
                    trigger: '.calculator',
                    start: 'top 75%'
                }
            });

            // Portfolio animation
            gsap.to('.portfolio-item', {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.portfolio',
                    start: 'top 75%'
                }
            });

            // Advantages animation
            gsap.to('.advantage-card', {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.advantages',
                    start: 'top 75%'
                }
            });

            // Stats counter on scroll
            ScrollTrigger.create({
                trigger: '.stats',
                start: 'top 80%',
                onEnter: () => {
                    animateCounters();
                },
                once: true
            });

            // Section headers animation
            gsap.to('.section-header', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: '.section-header',
                    start: 'top 80%'
                }
            });
        } else {
            // Fallback: show elements without GSAP
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
            });
        }
    }

    // Fallback scroll animations
    const fadeElements = document.querySelectorAll('.stat-item, .service-card, .calc-step, .portfolio-item, .advantage-card, .section-header');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Mobile call button click
document.addEventListener('DOMContentLoaded', function() {
    const mobileCallBtn = document.querySelector('.mobile-call-btn');
    if (mobileCallBtn) {
        mobileCallBtn.addEventListener('click', () => {
            window.location.href = 'tel:+79677397117';
        });
    }
});
