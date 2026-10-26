const chat = document.querySelector('#chat');
const form = document.querySelector('#form');
const input = document.querySelector('#message');
const aviso = document.querySelector('#aviso');
const sugerencias = document.querySelector('#sugerencias');
const titulo = document.querySelector('#titulo');

let NOMBRE = 'CenigrafBot';

let enviando = false;


function addMessage(who, text) {
  const p = document.createElement('p');
  p.className = `message ${who === 'Tú' ? 'user' : 'bot'}`;
  p.textContent = `${who}: ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  input.classList.toggle('invalido', Boolean(texto));
}


function setEnviando(estado) {
  enviando = estado;
  document
    .querySelectorAll('#sugerencias button, #form button')
    .forEach((boton) => { boton.disabled = estado; });
}

async function enviar(message) {
  
  if (enviando) return;

  setEnviando(true);
  addMessage('Tú', message);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (response.status === 422) throw new Error('El mensaje no es válido.');
    if (!response.ok) throw new Error('No se pudo obtener una respuesta.');
    const data = await response.json();
    addMessage(NOMBRE, data.reply);
  } catch (error) {
    addMessage(NOMBRE, `Error: ${error.message}`);
  } finally {
    
    setEnviando(false);
  }
}

function crearSugerencias(preguntas) {
  preguntas.forEach((pregunta) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = pregunta;
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
    document.title = NOMBRE;
    titulo.textContent = NOMBRE;
    addMessage(NOMBRE, config.bienvenida);
    crearSugerencias(config.preguntas);
  } catch {
    addMessage(NOMBRE, 'No se pudo cargar la configuración del chat.');
  }
}

input.addEventListener('input', () => mostrarAviso(''));

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