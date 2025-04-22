alert('Hello, World!');
// const data = await response.json();

//         if (!response.ok) {
//             // Show error alert
//             showAlert(data.error || 'An error occurred');
//             return;
//         }

//         // Handle success
//         console.log(data.message);

function showAlert(message) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.textContent = message;
    alertContainer.appendChild(alert);

    // Show the alert
    alert.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300); // Remove after fade-out
    }, 3000);
}