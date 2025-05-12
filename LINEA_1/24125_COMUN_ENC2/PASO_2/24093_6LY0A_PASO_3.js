document.addEventListener('DOMContentLoaded', function() {
    // Aplicar la animación de entrada cuando la página se carga
    document.body.classList.add('fade-in');

    // Redirigir a otra página con una animación de salida
    function redirectWithTransition(url) {
        document.body.classList.add('fade-out');
        setTimeout(function() {
            window.location.href = url;
        }, 1000);
    }

    // Obtener los datos del usuario desde la URL o sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId') || sessionStorage.getItem('userId');
    const userName = urlParams.get('userName') || sessionStorage.getItem('userName');
    const folio = sessionStorage.getItem('folio');
    const date = urlParams.get('date') || new Date().toLocaleDateString();
    const time = urlParams.get('time') || new Date().toLocaleTimeString();

    // Guardar fecha y hora para Power Automate (extra)
    sessionStorage.setItem('fechaPower', date);
    sessionStorage.setItem('horaPower', time);

    // Guardar el tiempo de término
    const endTime = Date.now();
    sessionStorage.setItem('endTime', endTime);

    // Verificar que todos los pasos anteriores se hayan completado
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop();
    const stepIndex = parseInt(currentFileName.match(/PASO_(\d+)/)[1], 10);
    const lastCompletedStep = parseInt(sessionStorage.getItem('lastCompletedStep'), 10) || 0;
    if (stepIndex !== lastCompletedStep + 1) {
        redirectToLogin();
        return;
    }
    sessionStorage.setItem('lastCompletedStep', stepIndex);

    // Calcular tiempo total transcurrido
    const startTime = parseInt(sessionStorage.getItem(`startTime_${userId}`), 10);
    const totalTime = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;
    const formattedTime = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calcular errores y resultado
    const attempts = JSON.parse(sessionStorage.getItem('attempts')) || {};
    let totalErrors = 0;
    Object.values(attempts).forEach(attemptCount => {
        if (attemptCount > 1) totalErrors += (attemptCount - 1);
    });
    let resultado;
    if      (totalErrors === 0)  resultado = 'S+';
    else if (totalErrors === 1)  resultado = 'S';
    else if (totalErrors === 2)  resultado = 'A+';
    else if (totalErrors === 3)  resultado = 'A';
    else if (totalErrors === 4)  resultado = 'A-';
    else if (totalErrors === 5)  resultado = 'B+';
    else if (totalErrors === 6)  resultado = 'B';
    else if (totalErrors === 7)  resultado = 'B-';
    else if (totalErrors === 8)  resultado = 'C+';
    else if (totalErrors === 9)  resultado = 'C';
    else if (totalErrors === 10) resultado = 'C-';
    else if (totalErrors === 11) resultado = 'D+';
    else if (totalErrors === 12) resultado = 'D';
    else if (totalErrors === 13) resultado = 'D-';
    else                          resultado = 'F';

    // Mostrar en interfaz
    document.getElementById('user-id').textContent = userId;
    document.getElementById('user-name').textContent = userName;
    document.getElementById('folio').textContent = folio;
    document.getElementById('total-time').textContent = formattedTime;
    const resultadoElement = document.getElementById('resultado');
    resultadoElement.textContent = resultado;
    resultadoElement.classList.add('bounce-in');

    // Llamada extra: enviar datos a Power Automate
    sendToPowerAutomate();

    // Al finalizar, generar CSV y redirigir
    document.getElementById('finalize-button').addEventListener('click', function() {
        generateCSV();
        sessionStorage.clear();
        redirectToLogin();
    });
});

function generateCSV() {
    const folio = sessionStorage.getItem('folio');
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    const linea = sessionStorage.getItem('linea');
    const partNumber = sessionStorage.getItem('partNumber');
    const startTime = parseInt(sessionStorage.getItem(`startTime_${userId}`), 10);
    const endTime = parseInt(sessionStorage.getItem('endTime'), 10);
    const totalTime = Math.floor((endTime - startTime) / 1000);
    const attempts = JSON.parse(sessionStorage.getItem('attempts')) || {};

    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;
    const formattedTime = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Lógica CSV original
    let csvContent = "Folio,UserId,UserName,Linea,PartNumber";
    Object.keys(attempts).forEach(step => {
        csvContent += `,${step}`;
    });
    csvContent += ",TotalTime\n";
    csvContent += `${folio},${userId},${userName},${linea},${partNumber}`;
    Object.values(attempts).forEach(count => {
        csvContent += `,${count}`;
    });
    csvContent += `,${formattedTime}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.hidden = true;
    a.href = url;
    a.download = `${folio}_evaluation.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Envío extra a Power Automate
function sendToPowerAutomate() {
    const payload = {
        Fecha:      sessionStorage.getItem('fechaPower'),
        Hora:       sessionStorage.getItem('horaPower'),
        Folio:      sessionStorage.getItem('folio'),
        UserId:     sessionStorage.getItem('userId'),
        UserName:   sessionStorage.getItem('userName'),
        Linea:      sessionStorage.getItem('linea'),
        PartNumber: sessionStorage.getItem('partNumber'),
        Estacion:   sessionStorage.getItem('estacion') || '',
        TotalTime:  document.getElementById('total-time').textContent
    };
    // Rellenar PASO_1 a PASO_10 con guiones
    for (let i = 1; i <= 10; i++) {
        payload[`PASO_${i}`] = '-';
    }
    fetch('https://prod-62.japaneast.logic.azure.com:443/workflows/2cf8a8a35c1e437ba741d6eb00483a2d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9LnciLruSLTaT2eL8_hiBdiLjGZFn53GYDv2ZhVPhT8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Error al enviar a Power Automate:', err));
}

// Redirigir al login
function redirectToLogin() {
    const segments = window.location.pathname.split('/');
    const basePath = segments.slice(0, -4).join('/');
    window.location.href = `${basePath}/LOGIN.html`;
}
