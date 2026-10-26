const chat = document.querySelector('#chat');
const form = document.querySelector('#form');
const input = document.querySelector('#message');
const aviso = document.querySelector('#aviso');
const sugerencias = document.querySelector('#sugerencias');
const titulo = document.querySelector('#titulo');
const botonLimpiar = document.querySelector('#limpiar');

let NOMBRE = 'CenigrafBot';
let BIENVENIDA = '';
let enviando = false;

// CAMBIO 1: un ícono decorativo para cada pregunta frecuente
const ICONOS = ['📚', '⏱️', '📝', '✅', '📍'];

// CAMBIO 2: hora de cada mensaje
function horaActual() {
  return new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// CAMBIO 3: avatar circular del bot
function crearAvatar() {
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'CB';
  return avatar;
}

// CAMBIO 4: cada mensaje es una fila con avatar, burbuja y hora
function addMessage(who, text) {
  const esUsuario = who === 'Tú';

  const fila = document.createElement('div');
  fila.className = `fila ${esUsuario ? 'user' : 'bot'}`;

  const burbuja = document.createElement('div');
  burbuja.className = 'burbuja';

  // Texto oculto visualmente, para lectores de pantalla
  const autor = document.createElement('span');
  autor.className = 'sr-only';
  autor.textContent = `${who}: `;

  const contenido = document.createElement('span');
  contenido.textContent = text;

  const hora = document.createElement('span');
  hora.className = 'hora';
  hora.textContent = horaActual();

  burbuja.append(autor, contenido, hora);

  if (!esUsuario) fila.append(crearAvatar());
  fila.append(burbuja);

  chat.appendChild(fila);
  chat.scrollTop = chat.scrollHeight;
}

// CAMBIO 5: indicador con avatar y tres puntos animados
function mostrarIndicador() {
  const fila = document.createElement('div');
  fila.id = 'indicador';
  fila.className = 'fila bot escribiendo';

  const burbuja = document.createElement('div');
  burbuja.className = 'burbuja';

  const puntos = document.createElement('span');
  puntos.className = 'puntos';
  puntos.setAttribute('aria-hidden', 'true');
  puntos.innerHTML = '<span></span><span></span><span></span>';

  const texto = document.createElement('span');
  texto.textContent = 'El chatbot está escribiendo…';

  burbuja.append(puntos, texto);
  fila.append(crearAvatar(), burbuja);

  chat.appendChild(fila);
  chat.scrollTop = chat.scrollHeight;
}

function ocultarIndicador() {
  const indicador = document.querySelector('#indicador');
  if (indicador) indicador.remove();
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  input.classList.toggle('invalido', Boolean(texto));
}

function setEnviando(estado) {
  enviando = estado;
  document
    .querySelectorAll('#sugerencias button, #form button, #limpiar')
    .forEach((boton) => { boton.disabled = estado; });
}

function limpiarChat() {
  if (enviando) return;
  if (!confirm('¿Seguro que quieres borrar la conversación?')) return;

  chat.replaceChildren();
  mostrarAviso('');

  if (BIENVENIDA) addMessage(NOMBRE, BIENVENIDA);
}

async function enviar(message) {
  if (enviando) return;

  setEnviando(true);
  addMessage('Tú', message);
  mostrarIndicador();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (response.status === 422) throw new Error('El mensaje no es válido.');
    if (!response.ok) throw new Error('No se pudo obtener una respuesta.');
    const data = await response.json();

    ocultarIndicador();
    addMessage(NOMBRE, data.reply);
  } catch (error) {
    ocultarIndicador();
    addMessage(NOMBRE, `Error: ${error.message}`);
  } finally {
    ocultarIndicador();
    setEnviando(false);
  }
}

// CAMBIO 6: las preguntas frecuentes ahora llevan ícono
function crearSugerencias(preguntas) {
  preguntas.forEach((pregunta, indice) => {
    const b = document.createElement('button');
    b.type = 'button';

    const icono = document.createElement('span');
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = ICONOS[indice] || '💬';

    b.append(icono, document.createTextNode(pregunta));
    b.addEventListener('click', () => {
      mostrarAviso('');
      enviar(pregunta);
    });
    sugerencias.appendChild(b);
  });
}

async function iniciar() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error();
    const config = await response.json();

    NOMBRE = config.nombre;
    BIENVENIDA = config.bienvenida;
    document.title = NOMBRE;
    titulo.textContent = NOMBRE;
    addMessage(NOMBRE, BIENVENIDA);
    crearSugerencias(config.preguntas);
  } catch {
    addMessage(NOMBRE, 'No se pudo cargar la configuración del chat.');
  }
}

input.addEventListener('input', () => mostrarAviso(''));
botonLimpiar.addEventListener('click', limpiarChat);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (enviando) return;

  const message = input.value.trim();
  if (!message) {
    mostrarAviso('⚠️ Escribe un mensaje antes de enviar.');
    input.focus();
    return;
  }
  mostrarAviso('');
  input.value = '';
  enviar(message);
});

iniciar();  