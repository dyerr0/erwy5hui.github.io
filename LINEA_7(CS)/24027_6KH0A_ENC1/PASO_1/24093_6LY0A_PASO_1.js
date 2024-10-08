let selectedCable = null;
let connections = [];
let countdown;  // Variable para almacenar el temporizador
let timeLeft = 180; // Tiempo en segundos (3 minutos=180)

// Obtener el ID del usuario desde sessionStorage
let userId = sessionStorage.getItem('userId');
 
window.onload = function () {
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop(); // Obtener el nombre del archivo actual
    const stepIndex = parseInt(currentFileName.match(/PASO_(\d+)/)[1]); // Extraer el número del paso

    // Verificar si el usuario ha completado el paso anterior
    const lastCompletedStep = parseInt(sessionStorage.getItem('lastCompletedStep')) || 0;

    if (stepIndex !== lastCompletedStep + 1) {
        // Si el paso actual no es el siguiente en la secuencia, redirigir al login
        redirectToLogin();
        return;
    }

    // Si es PASO_1, iniciar la evaluación con la lógica actual
    if (stepIndex === 1) {
        if (sessionStorage.getItem(`evaluationStarted_${userId}`) === 'true') {
            // Si ya se inició, redirigir al login
            redirectToLogin();
        } else {
            // Mostrar el modal para confirmar inicio
            const modal = document.getElementById('confirmation-modal');
            modal.style.display = 'block';

            // Manejar la confirmación de iniciar la evaluación
            document.getElementById('confirm-start').addEventListener('click', function () {
                sessionStorage.setItem(`evaluationStarted_${userId}`, 'true');
                const startTime = new Date().getTime();
                sessionStorage.setItem(`startTime_${userId}`, startTime); // Guardar la hora de inicio
                modal.style.display = 'none';
                startTimer(); // Iniciar el temporizador
                sessionStorage.setItem('lastCompletedStep', 1); // Marcar PASO_1 como completado
            });

            // Manejar la cancelación, redirigir al login
            document.getElementById('cancel-start').addEventListener('click', function () {
                redirectToLogin();
            });
        }
    } else {
        // Para cualquier otro paso, solo continuar con el temporizador desde la hora de inicio almacenada
        startTimer(); // Iniciar el temporizador
    }
};

// Función para iniciar el temporizador
function startTimer() {
    const timerDisplay = document.getElementById('timer');

    countdown = setInterval(function() {
        const startTime = parseInt(sessionStorage.getItem(`startTime_${userId}`));
        const currentTime = new Date().getTime();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);

        timeLeft = 180 - elapsedTime;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            showTimeoutModal(); // Mostrar el modal de tiempo agotado
        } else {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;

            // Actualizar el contenido del temporizador en la pantalla
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}

// Función para mostrar el modal de tiempo agotado
function showTimeoutModal() {
    const timeoutModal = document.getElementById('timeout-modal');
    timeoutModal.style.display = 'block';

    document.getElementById('exit-evaluation').addEventListener('click', function() {
        redirectToLogin();
    });
}

// Función para redirigir al login
function redirectToLogin() {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');

    // Subir tres niveles desde el paso (ejemplo: /LINEA_X/NUMERO_PARTE/PASO_X/)
    const loginPath = pathSegments.slice(0, -4).join('/') + '/LOGIN.html';

    window.location.href = loginPath;
}

function selectCable(event) {
    const cableItem = event.currentTarget; // El elemento sobre el cual se hace clic

    // Verificar si ya está seleccionada
    if (selectedCable && selectedCable.element === cableItem) {
        // Si ya está seleccionada, deseleccionarla
        selectedCable.element.classList.remove('selected');
        selectedCable = null;
        return; // Salir de la función para deseleccionar
    }

    // Si hay un cable previamente seleccionado, eliminar su enmarcado
    if (selectedCable) {
        selectedCable.element.classList.remove('selected');
    }

    // Marcar el nuevo cable como seleccionado
    cableItem.classList.add('selected');
    selectedCable = {
        element: cableItem,
        letter: cableItem.querySelector('.cable-letter').textContent // Capturar la letra
    };
}

// Eliminamos la función moveCable y cualquier referencia a la generación de líneas.

document.addEventListener('DOMContentLoaded', function() {
    // Aplicar la animación de entrada cuando la página se carga
    document.body.classList.add('fade-in');

    // Redirigir a otra página con una animación de salida
    function redirectWithTransition(url) {
        document.body.classList.add('fade-out');
        setTimeout(function() {
            window.location.href = url;
        }, 1000); // El tiempo aquí debe coincidir con la duración de la animación fade-out (1s)
    }

    const pathSegments = window.location.pathname.split('/');
    const stepFolder = pathSegments[pathSegments.length - 2]; // Carpeta del paso actual
    const stepName = stepFolder.replace('_', ' '); // Reemplazar _ por un espacio

    const stepElement = document.getElementById('step');
    stepElement.textContent = stepName.charAt(0).toUpperCase() + stepName.slice(1); // Capitaliza la primera letra

    const connectorElement = document.querySelector('.connector');

    // Calcular cuántas cavidades irán en la fila inferior y superior
    const cavitiesPerRowBottom = Math.ceil(numberOfCavities / 2); // Redondear hacia arriba para la fila inferior
    const cavitiesPerRowTop = Math.floor(numberOfCavities / 2);  // Redondear hacia abajo para la fila superior

    // Generar cavidades automáticamente
    for (let i = 1; i <= numberOfCavities; i++) {
        const cavity = document.createElement('div');
        cavity.className = 'cavity';
        cavity.dataset.id = i;
        cavity.textContent = i;
        cavity.style.position = 'absolute'; // Asegura que se pueda posicionar

        const connectorElement = document.querySelector('.connector');
        connectorElement.appendChild(cavity);

        // Verificar si la posición ya está definida en el CSS
        const computedStyle = window.getComputedStyle(cavity);
        const topCSS = computedStyle.getPropertyValue('top');
        const leftCSS = computedStyle.getPropertyValue('left');

        if (topCSS === 'auto' || leftCSS === 'auto') {
            // Si no hay posición en el CSS, usar la posición generada automáticamente

            // Determinar si la cavidad está en la fila superior o inferior
            let rowIndex, colIndex;
            if (i <= cavitiesPerRowBottom) {
                // Colocar en la fila inferior
                rowIndex = 0; // Fila inferior
                colIndex = i - 1;
            } else {
                // Colocar en la fila superior
                rowIndex = 1; // Fila superior
                colIndex = i - 1 - cavitiesPerRowBottom;
            }

            // Posicionar las cavidades
            const topOffset = 160 - rowIndex * 45; // Ajusta la altura de las filas (primera fila abajo)
            const leftOffset = 60 + colIndex * 35; // Ajusta la separación entre cavidades

            cavity.style.top = `${topOffset}px`;
            cavity.style.left = `${leftOffset}px`;
        }

        // Asigna el evento de clic
        cavity.onclick = handleCavityClick;
    }
});

function handleCavityClick(event) {
    const cavityElement = event.currentTarget;
    const cavityId = cavityElement.dataset.id;

    // Verificar si ya hay un cable conectado a esta cavidad
    const existingConnection = connections.find(connection => connection.cavityId === cavityId);

    if (!selectedCable) {
        // Si no hay ninguna letra seleccionada, eliminar las letras de la cavidad
        removeCableFromCavity(cavityId);
    } else {
        // Si hay una letra seleccionada, agregarla a la cavidad sin borrar lo que ya tiene
        placeCable(cavityElement);
    }
}

function placeCable(cavityElement) {
    if (!selectedCable) return;

    // Obtener las letras ya asignadas a la cavidad
    let assignedLetters = cavityElement.dataset.letters ? JSON.parse(cavityElement.dataset.letters) : [];

    // Verificar si la letra ya está asignada
    if (assignedLetters.includes(selectedCable.letter)) {
        return; // No agregamos la letra si ya está asignada
    }

    // Añadir la nueva letra al arreglo de letras asignadas
    assignedLetters.push(selectedCable.letter);

    // Almacenar las letras asignadas en el dataset como una cadena JSON
    cavityElement.dataset.letters = JSON.stringify(assignedLetters);

    // Actualizar el texto dentro de la cavidad
    cavityElement.innerHTML = ''; // Limpiar antes de agregar el contenido actualizado
    const cavityLetter = document.createElement('div');
    cavityLetter.style.width = '100%';
    cavityLetter.style.height = '100%';
    cavityLetter.style.display = 'flex';
    cavityLetter.style.alignItems = 'center';
    cavityLetter.style.justifyContent = 'center';
    cavityLetter.textContent = assignedLetters.join(' - '); // Mostrar las letras separadas por ' - '
    cavityLetter.style.pointerEvents = 'none'; // Asegurarse de que no intercepte clics
    cavityElement.appendChild(cavityLetter);

    // Añadir la clase 'assigned' para la animación
    cavityElement.classList.add('assigned');

    // Actualizar las conexiones: eliminar cualquier conexión existente para esta cavidad
    connections = connections.filter(conn => conn.cavityId !== cavityElement.dataset.id);

    // Guardar la nueva conexión
    connections.push({
        cableId: selectedCable.element.dataset.id,
        cavityId: cavityElement.dataset.id,
        cavityElement: cavityElement,
        letters: assignedLetters // Guardar las letras asignadas
    });

    // Eliminar la selección del cable asignado
    selectedCable.element.classList.remove('selected');
    selectedCable = null;
}

function checkCavityCorrect(cavityElement, requiredLetters) {
    // Obtener las letras asignadas desde el dataset
    const assignedLetters = cavityElement.dataset.letters ? JSON.parse(cavityElement.dataset.letters) : [];
    
    // Ordenar las letras asignadas y las letras requeridas
    const sortedAssigned = assignedLetters.slice().sort().join('-');
    const sortedRequired = requiredLetters.slice().sort().join('-');

    // Comparar las letras ordenadas
    return sortedAssigned === sortedRequired;
}

function resetSelectedCable() {
    if (selectedCable) {
        if (selectedCable.delimiter) {
            selectedCable.delimiter.remove();
        }
    }
    document.removeEventListener("mousemove", moveCable);
    selectedCable = null;
}

function removeCableFromCavity(cavityId) {
    // Buscar la conexión correspondiente
    const connectionIndex = connections.findIndex(connection => connection.cavityId === cavityId);

    if (connectionIndex !== -1) {
        const connection = connections[connectionIndex];

        // Limpiar el contenido de la cavidad
        connection.cavityElement.innerHTML = '';
        connection.cavityElement.dataset.letters = ''; // Vaciar el dataset de letras

        // Remover la clase 'assigned' para detener la animación
        connection.cavityElement.classList.remove('assigned');

        // Eliminar la conexión de la lista
        connections.splice(connectionIndex, 1);
    }
}

function removeCable(event) {
    const cavityId = event.target.dataset.id;

    const connectionIndex = connections.findIndex(connection => connection.cavityId === cavityId);

    if (connectionIndex !== -1) {
        const connection = connections[connectionIndex];
        connection.cavityCircle.remove(); // Remover el círculo de la cavidad
        connections.splice(connectionIndex, 1);
    }
}

// Eliminamos la función updateLines ya que no hay líneas que actualizar.

function evaluateConnections() {
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop(); // Obtener el nombre del archivo actual
    const stepIndex = parseInt(currentFileName.match(/PASO_(\d+)/)[1]); // Extraer el número del paso

    let attempts = JSON.parse(sessionStorage.getItem('attempts')) || {};
    const currentStep = `ENC_${stepIndex}`;

    if (!attempts[currentStep]) {
        attempts[currentStep] = 0;
    }
    attempts[currentStep] += 1;  // Incrementar intentos para este paso
    sessionStorage.setItem('attempts', JSON.stringify(attempts));

    if (connections.length === 0) {
        const resultElement = document.getElementById("result");
        resultElement.textContent = "No hay conexiones realizadas.";
        resultElement.style.color = "orange";
        return;
    }

    let isCorrect = true;
    for (let cavityId in correctConnections) {
        const requiredLetters = correctConnections[cavityId]; // Ahora es un arreglo
        const connection = connections.find(conn => conn.cavityId == cavityId);

        if (!connection) {
            isCorrect = false;
            break;
        }

        const assignedLetters = connection.letters;

        // Comparar las letras asignadas con las requeridas, sin importar el orden
        const sortedAssigned = assignedLetters.slice().sort();
        const sortedRequired = requiredLetters.slice().sort();

        if (sortedAssigned.length !== sortedRequired.length) {
            isCorrect = false;
            break;
        }

        for (let i = 0; i < sortedAssigned.length; i++) {
            if (sortedAssigned[i] !== sortedRequired[i]) {
                isCorrect = false;
                break;
            }
        }

        if (!isCorrect) {
            break;
        }
    }

    const resultElement = document.getElementById("result");
    if (isCorrect) {
        resultElement.textContent = "¡Conexión correcta!";
        resultElement.style.color = "green";
        showNextStepButton(); // Mostrar el botón "Siguiente Paso"
    } else {
        resultElement.textContent = "Conexión incorrecta";
        resultElement.style.color = "red";
    }
}

function showNextStepButton() {
    const nextButton = document.getElementById('next-step-button');
    nextButton.style.display = 'inline-block'; // Mostrar el botón

    // Asignar la función para ir al siguiente paso
    nextButton.onclick = function() {
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/');

        // Obtener el nombre del archivo actual
        const currentFileName = pathSegments[pathSegments.length - 1]; // e.g., 24093_6LY0A_PASO_1.html

        // Extraer el número de paso actual del nombre del archivo
        const stepIndex = parseInt(currentFileName.match(/PASO_(\d+)/)[1]);
        const nextStepIndex = stepIndex + 1;

        // Guardar el último paso completado
        sessionStorage.setItem('lastCompletedStep', stepIndex);

        // Construir el nombre del archivo para el siguiente paso
        const nextStepFileName = currentFileName.replace(`PASO_${stepIndex}`, `PASO_${nextStepIndex}`);

        // Construir la ruta completa para la carpeta del siguiente paso
        const currentPartFolder = pathSegments.slice(0, -2).join('/'); // Subir hasta la carpeta del número de parte
        const nextStepFolder = `PASO_${nextStepIndex}`; // Carpeta del siguiente paso
        const fullNextStepPath = `${currentPartFolder}/${nextStepFolder}/${nextStepFileName}`;

        window.location.href = fullNextStepPath;
    };
}

const numberOfCavities = 27; // Declara aquí el número de cavidades que necesitas

// Definir qué cable va en cada cavidad usando arreglos
const correctConnections = {
    4: ['P', 'MV'],  
    7: ['CR'],       
    8: ['PT'],       
    10: ['P', 'MV'],       
    11: ['M'],       
};