// State management
const state = {
    currentPage: 1,
    thoughtsPerPage: 6,
    thoughts: [],
    userName: '',
    darkMode: false,
    pollingInterval: null,
    lastUpdate: null,
    isPolling: false
};

const MAX_THOUGHT_LENGTH = 100;

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
    notificationPill: document.querySelector('.notification-pill'),
    prevPageBtn: document.querySelector('.prev-page'),
    nextPageBtn: document.querySelector('.next-page')
};

// Event Listeners
function initializeEventListeners() {
    document.addEventListener('keyup', handleKeyPress);
    elements.sendButton.addEventListener('click', handleThoughtSubmit);
    elements.addThoughtBtn.addEventListener('click', showChatInterface);
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
    elements.notificationPill.addEventListener('click', async () => {
        elements.notificationPill.classList.add('hidden');
        await renderThoughts();
    });
    document.addEventListener('click', handleDarkMode);
}

// Polling function
async function pollForNewThoughts() {
    if (state.isPolling) return;
    
    try {
        state.isPolling = true;
        const response = await fetch(`/api/notes/${state.currentPage}`);
        if (!response.ok) throw new Error('Failed to fetch thoughts');
        
        const data = await response.json();
        const latestThoughtTime = state.lastUpdate;
        
        // Check if there are any newer thoughts
        const hasNewThoughts = data.notes.some(thought =>
            !latestThoughtTime || new Date(thought.timestamp) > new Date(latestThoughtTime)
        );
        
        if (hasNewThoughts) {
            elements.notificationPill.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error polling thoughts:', error);
    } finally {
        state.isPolling = false;
    }
}

function startPolling() {
    if (!state.pollingInterval) {
        state.pollingInterval = setInterval(pollForNewThoughts, 1000); // Poll every 1 second (bad idea) seconds
    }
}

function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
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
        
        const data = await response.json();
        elements.chatInput.value = '';
        
        // Reset to first page and update timestamp
        state.currentPage = 1;
        state.lastUpdate = data.note.timestamp;
        
        elements.chatInterface.style.display = 'none';
        showThoughtsView();
        await renderThoughts();
        
        // Highlight new thought
        const newCard = document.querySelector(`[data-id="${data.note.id}"]`);
        if (newCard) {
            newCard.classList.add('new-thought');
            setTimeout(() => newCard.classList.remove('new-thought'), 1000);
        }
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
    stopPolling();
    elements.thoughtsView.classList.remove('visible');
    elements.chatInterface.style.display = 'block';
    elements.chatInput.value = '';
    fadeIn(elements.chatInterface);
    elements.chatInput.focus();
}

function showThoughtsView() {
    elements.thoughtsView.style.display = 'block';
    elements.thoughtsView.classList.add('visible');
    startPolling();
    renderThoughts();
}

async function renderThoughts() {
    try {
        const response = await fetch(`/api/notes/${state.currentPage}`);
        if (!response.ok) throw new Error('Failed to fetch thoughts');
        
        const data = await response.json();
        
        // Update last update timestamp
        if (data.notes.length > 0) {
            state.lastUpdate = data.notes[0].timestamp;
        }
        
        const html = data.notes.map(thought => `
            <div class="thought-card" data-id="${thought.id}">
                <div class="thought-content">${thought.content}</div>
                <div class="thought-meta">
                    ${thought.author} • ${new Date(thought.timestamp).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    })}
                </div>
            </div>
        `).join('');

        elements.thoughtsContainer.innerHTML = html;
        elements.notificationPill.classList.add('hidden');
        updatePagination(data.totalPages);
    } catch (error) {
        console.error('Error fetching thoughts:', error);
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

// Pagination
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
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === maxPage || maxPage === 0;
}

// Cleanup
function cleanup() {
    stopPolling();
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeEventListeners);
window.addEventListener('beforeunload', cleanup);
