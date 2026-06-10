document.addEventListener('DOMContentLoaded', () => {
    const authForms = document.querySelectorAll('[data-auth-form]');

    if (!authForms.length) {
        return;
    }

    authForms.forEach((form) => {
        const alertBox = form.querySelector('[data-auth-alert]');
        const submitButton = form.querySelector('button[type="submit"]');

        const showAlert = (message, type = 'danger') => {
            if (!alertBox) {
                return;
            }

            alertBox.className = `auth-alert alert alert-${type}`;
            alertBox.textContent = message;
            alertBox.hidden = false;
        };

        const setLoading = (isLoading) => {
            if (!submitButton) {
                return;
            }

            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? 'Please wait...' : (form.dataset.authForm === 'login' ? 'Sign In' : 'Create Account');
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (alertBox) {
                alertBox.hidden = true;
                alertBox.textContent = '';
            }

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            if (form.dataset.authForm === 'register' && payload.password !== payload.confirm_password) {
                showAlert('Passwords do not match.');
                return;
            }

            setLoading(true);

            try {
                const endpoint = form.dataset.authForm === 'login'
                    ? '/api/auth/login'
                    : '/api/auth/register';

                const body = form.dataset.authForm === 'login'
                    ? {
                        email: payload.email,
                        password: payload.password
                    }
                    : {
                        full_name: payload.full_name,
                        email: payload.email,
                        password: payload.password,
                        phone: payload.phone
                    };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    showAlert(result.message || 'Something went wrong.');
                    return;
                }

                if (form.dataset.authForm === 'register') {
                    window.location.href = '/login';
                    return;
                }

                window.location.href = '/';
            } catch (error) {
                showAlert('Unable to complete the request right now.');
            } finally {
                setLoading(false);
            }
        });
    });
});