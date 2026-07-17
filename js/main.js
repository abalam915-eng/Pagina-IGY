/**
 * main.js
 *
 * Interactividad nueva del sitio institucional:
 * - menú móvil;
 * - envío del formulario corto de Agenda;
 * - modal de historia completa;
 * - animaciones suaves al hacer scroll.
 */

document.addEventListener('DOMContentLoaded', () => {
    const APPOINTMENT_ENDPOINT = '/api/portal/appointment-contact';

    /* ==========================================================================
       MENÚ MÓVIL
       En celular oculta los enlaces dentro de un botón para mantener limpia la barra.
       ========================================================================== */
    const siteHeader = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const headerMenu = document.querySelector('#site-menu');

    function closeMobileMenu() {
        siteHeader?.classList.remove('menu-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Abrir menú');
    }

    menuToggle?.addEventListener('click', () => {
        const isOpen = siteHeader?.classList.toggle('menu-open') || false;
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    headerMenu?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    /* ==========================================================================
       FORMULARIO CORTO DE AGENDA
       Envia nombre, teléfono, origen y honeypot al backend.
       El backend repite validación y envía la notificación.
       ========================================================================== */
    const appointmentForms = document.querySelectorAll('.appointment-form');

    function getFormPayload(form) {
        const data = new FormData(form);
        return {
            nombre: String(data.get('nombre') || '').trim(),
            telefono: String(data.get('telefono') || '').trim(),
            empresa: String(data.get('empresa') || '').trim(),
            origen: form.dataset.formLocation || 'sitio',
        };
    }

    function setFormMessage(form, message, type = '') {
        const messageEl = form.querySelector('.form-message');
        if (!messageEl) return;
        messageEl.textContent = message;
        messageEl.className = `form-message ${type}`.trim();
    }

    function validateAppointment(payload) {
        if (!payload.nombre) return 'Escribe tu nombre.';
        if (!payload.telefono) return 'Escribe tu teléfono de contacto.';
        if (payload.telefono.replace(/\D/g, '').length < 8) return 'Escribe un teléfono válido.';
        return '';
    }

    async function sendAppointmentRequest(payload) {
        const response = await fetch(APPOINTMENT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'No se pudo enviar la solicitud.');
        }

        return data;
    }

    appointmentForms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const payload = getFormPayload(form);
            const error = validateAppointment(payload);
            const submitButton = form.querySelector('button[type="submit"]');

            if (error) {
                setFormMessage(form, error, 'error');
                return;
            }

            submitButton.disabled = true;
            setFormMessage(form, 'Enviando solicitud...', 'loading');

            try {
                await sendAppointmentRequest(payload);
                form.reset();
                setFormMessage(form, 'Solicitud enviada. Nos comunicaremos contigo pronto.', 'success');
            } catch (sendError) {
                setFormMessage(form, sendError.message, 'error');
            } finally {
                submitButton.disabled = false;
            }
        });
    });

    /* ==========================================================================
       HISTORIA COMPLETA
       Abre una sobreposición para leer la historia sin estirar la imagen original.
       ========================================================================== */
    const storyModal = document.querySelector('[data-story-modal]');
    const openStoryButton = document.querySelector('[data-open-story]');
    const closeStoryButtons = document.querySelectorAll('[data-close-story]');
    let lastFocusedElement = null;

    function openStoryModal() {
        if (!storyModal) return;
        lastFocusedElement = document.activeElement;
        storyModal.hidden = false;
        document.body.classList.add('modal-open');
        storyModal.querySelector('.story-back')?.focus();
    }

    function closeStoryModal() {
        if (!storyModal) return;
        storyModal.hidden = true;
        document.body.classList.remove('modal-open');
        lastFocusedElement?.focus();
    }

    openStoryButton?.addEventListener('click', openStoryModal);

    closeStoryButtons.forEach((button) => {
        button.addEventListener('click', closeStoryModal);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }

        if (event.key === 'Escape' && storyModal && !storyModal.hidden) {
            closeStoryModal();
        }
    });

    /* ==========================================================================
       ANIMACIONES SUAVES AL HACER SCROLL
       Dan movimiento ligero a secciones y tarjetas sin saturar el sitio.
       ========================================================================== */
    const revealItems = [
        ...document.querySelectorAll('.section-heading, .service-card, .identity-band article, .story-section, .gallery-card, .agenda-preview, .contact-section'),
    ];

    revealItems.forEach((item, index) => {
        item.classList.add('reveal-ready');
        item.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 90}ms`);
    });

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.18 });

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }
});
