// State management
const state = {
    currentPage: 1,
    thoughtsPerPage: 6,
    thoughts: [],
    userName: '',
    darkMode: false
};

const MAX_THOUGHT_LENGTH = 280; // Twitter-like limit


// DOM Elements
const elements = {
    initialContent: document.querySelector('.initial-content'),
    chatInterface: document.querySelector('.chat-interface'),
    thoughtsView: document.querySelector('.thoughts-view'),
    nameInput: document.querySelector('.inputs'),
    chatInput: document.querySelector('.chat-input'),
    thoughtsContainer: document.querySelector('.thoughts-container'),
    userNameDisplay: document.querySelector('.user-name'),
    sendButton: document.querySelector('.send-button'),
    addThoughtBtn: document.querySelector('.add-thought'),
    pageNumber: document.querySelector('.page-number'),
    buttonContainer: document.querySelector('.button-container')
};

// Event Listeners
function initializeEventListeners() {
    // Handle all keypress events
    document.addEventListener('keyup', handleKeyPress);
    
    // Button clicks
    elements.sendButton.addEventListener('click', handleThoughtSubmit);
    elements.addThoughtBtn.addEventListener('click', showChatInterface);
    
    // Pagination
    document.querySelector('.prev-page').addEventListener('click', () => changePage(-1));
    document.querySelector('.next-page').addEventListener('click', () => changePage(1));
    
    // Dark mode toggle
    document.addEventListener('click', handleDarkMode);
}

// Event Handlers

function handleKeyPress(event) {
    
    if (event.key === 'Enter') {
        if (event.target === elements.nameInput) {
            const name = event.target.value.trim();
            if (name) {
                handleNameSubmit(name);
            }
        } else if (event.target === elements.chatInput) {
            if (elements.chatInput.value.length > MAX_THOUGHT_LENGTH) {
                shakeInput();
                return;
            }
            handleThoughtSubmit();
        }
    }
    
    // Check length while typing
    if (event.target === elements.chatInput) {
        if (event.target.value.length > MAX_THOUGHT_LENGTH) {
            shakeInput();
            event.target.value = event.target.value.slice(0, MAX_THOUGHT_LENGTH);
        }
    }
    
    
}

function shakeInput() {
    elements.chatInput.classList.add('shake');
    setTimeout(() => elements.chatInput.classList.remove('shake'), 500);
}

function handleNameSubmit(name) {
    state.userName = name;
    elements.userNameDisplay.textContent = name;
    
    fadeOut(elements.initialContent).then(() => {
        elements.initialContent.style.display = 'none';
        elements.chatInterface.style.display = 'block';
        fadeIn(elements.chatInterface);
        elements.chatInput.focus();
    });
}

function handleThoughtSubmit() {
    const thought = elements.chatInput.value.trim();
    if (!thought || thought.length > MAX_THOUGHT_LENGTH) return;
    
    const newThought = createThought(thought);
    state.thoughts.unshift(newThought);
    elements.chatInput.value = '';
    
    elements.chatInterface.style.display = 'none';
    showThoughtsView();
    state.currentPage = 1; // Reset to first page
    renderThoughts();
    highlightNewThought(newThought.id);
}

function handleDarkMode(event) {
    if (event.target.closest('.main-content')) return;
    
    document.body.classList.add('animation-ready');
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark', state.darkMode);
}

// UI Updates
function showChatInterface() {
    elements.thoughtsView.classList.remove('visible');
    elements.chatInterface.style.display = 'block';
    elements.chatInput.value = ''; // Clear any previous input
    fadeIn(elements.chatInterface);
    elements.chatInput.focus();
}

function showThoughtsView() {
    elements.thoughtsView.style.display = 'block';
    elements.thoughtsView.classList.add('visible');
    renderThoughts();
}

function renderThoughts() {
    const start = (state.currentPage - 1) * state.thoughtsPerPage;
    const pageThoughts = state.thoughts.slice(start, start + state.thoughtsPerPage);
    
    const html = pageThoughts.map(thought => `
        <div class="thought-card" data-id="${thought.id}">
            <div class="thought-content">${thought.content}</div>
            <div class="thought-meta">${thought.author} • ${thought.timestamp}</div>
        </div>
    `).join('');
    
    elements.thoughtsContainer.innerHTML = html;
    updatePagination();
}

// Animations
function fadeOut(element) {
    element.classList.add('fade-out');
    return new Promise(resolve => setTimeout(resolve, 500));
}

function fadeIn(element) {
    element.classList.remove('fade-out');
    element.classList.add('fade-in');
}

function highlightNewThought(id) {
    setTimeout(() => {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.classList.add('new-card');
        }
    }, 100);
}

// Utilities
function createThought(content) {
    return {
        id: Date.now(),
        content,
        author: state.userName,
        timestamp: new Date().toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        })
    };
}

function changePage(delta) {
    const newPage = state.currentPage + delta;
    const maxPage = Math.ceil(state.thoughts.length / state.thoughtsPerPage);
    
    if (newPage > 0 && newPage <= maxPage) {
        state.currentPage = newPage;
        renderThoughts();
    }
}

function updatePagination() {
    const maxPage = Math.ceil(state.thoughts.length / state.thoughtsPerPage);
    
    document.querySelector('.prev-page').disabled = state.currentPage === 1;
    document.querySelector('.next-page').disabled = state.currentPage === maxPage || maxPage === 0;
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeEventListeners);
