/**
 * main.js
 *
 * Interactividad nueva del sitio institucional:
 * - envio del formulario corto de Agenda;
 * - mensajes de exito/error sin recargar;
 * - preparacion para enlace externo a VitaMayor.
 */

document.addEventListener('DOMContentLoaded', () => {
    const APPOINTMENT_ENDPOINT = '/api/portal/appointment-contact';

    /* ==========================================================================
       FORMULARIO CORTO DE AGENDA
       Se usa en index.html y agenda.html. Solo pide nombre y telefono porque
       la pagina funciona como carta de presentacion y contacto inicial.
       ========================================================================== */
    const appointmentForms = document.querySelectorAll('.appointment-form');

    function getFormPayload(form) {
        const data = new FormData(form);
        return {
            nombre: String(data.get('nombre') || '').trim(),
            telefono: String(data.get('telefono') || '').trim(),
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
        if (!payload.telefono) return 'Escribe tu telefono de contacto.';
        if (payload.telefono.replace(/\D/g, '').length < 8) return 'Escribe un telefono valido.';
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
});
