// State management
const state = {
    currentPage: 1,
    thoughtsPerPage: 6,
    thoughts: [],
    userName: '',
    darkMode: false
};

const MAX_THOUGHT_LENGTH = 100; // Twitter-like limit


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
    elements.chatInput.closest('.chat-container').classList.add('shake');
    setTimeout(() => elements.chatInput.closest('.chat-container').classList.remove('shake'), 500);
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

async function handleThoughtSubmit() {
    const thought = elements.chatInput.value.trim();
    if (!thought || thought.length > MAX_THOUGHT_LENGTH) return;
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: thought,
                author: state.userName
            })
        });

        if (!response.ok) throw new Error('Failed to post thought');
        
        const newThought = await response.json();
        elements.chatInput.value = '';
        
        elements.chatInterface.style.display = 'none';
        showThoughtsView();
        state.currentPage = 1; // Reset to first page
        await renderThoughts();
        highlightNewThought(newThought.id);
    } catch (error) {
        console.error('Error posting thought:', error);
    }
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

async function renderThoughts() {
    try {
        const response = await fetch(`/api/notes/${state.currentPage}`);
        if (!response.ok) throw new Error('Failed to fetch thoughts');
        
        const data = await response.json();
        const pageThoughts = data.notes;
        
        const html = pageThoughts.map(thought => `
            <div class="thought-card" data-id="${thought.id}">
                <div class="thought-content">${thought.content}</div>
                <div class="thought-meta">${thought.author} • ${new Date(thought.timestamp).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                })}</div>
            </div>
        `).join('');
        
        elements.thoughtsContainer.innerHTML = html;
        updatePagination(data.totalPages);
    } catch (error) {
        console.error('Error fetching thoughts:', error);
        // You might want to show an error message to the user here
    }
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

async function changePage(delta) {
    const newPage = state.currentPage + delta;
    try {
        const response = await fetch(`/api/notes/${newPage}`);
        if (!response.ok) throw new Error('Failed to fetch page');
        
        const data = await response.json();
        if (newPage > 0 && newPage <= data.totalPages) {
            state.currentPage = newPage;
            await renderThoughts();
        }
    } catch (error) {
        console.error('Error changing page:', error);
    }
}

function updatePagination(maxPage) {
    document.querySelector('.prev-page').disabled = state.currentPage === 1;
    document.querySelector('.next-page').disabled = state.currentPage === maxPage || maxPage === 0;
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeEventListeners);
