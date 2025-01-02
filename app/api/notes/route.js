// In-memory storage for notes (will reset on server restart)
export let notes = [];

// Maximum length for content
const MAX_CONTENT_LENGTH = 1000;
// Maximum notes to store
const MAX_NOTES = 1000;

function sanitizeInput(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function GET() {
    try {
        const shuffledNotes = [...notes].sort(() => Math.random() - 0.5);
        
        return Response.json({
            notes: shuffledNotes.slice(0, 6),
            total: notes.length
        });
    } catch (error) {
        console.error('GET Error:', error);
        return Response.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        
        // Basic validation
        if (!data.content?.trim() || !data.author?.trim()) {
            return Response.json(
                { error: 'Content and author are required' },
                { status: 400 }
            );
        }

        // Length validation
        if (data.content.length > MAX_CONTENT_LENGTH) {
            return Response.json(
                { error: 'Content too long' },
                { status: 400 }
            );
        }

        // Prevent note overflow
        if (notes.length >= MAX_NOTES) {
            // Remove oldest note
            notes.pop();
        }

        // Create new note with sanitized input
        const newNote = {
            id: Date.now().toString(),
            content: sanitizeInput(data.content.trim()),
            author: sanitizeInput(data.author.trim()),
            timestamp: new Date().toISOString(),
        };

        // Add to start of array (newest first)
        notes.unshift(newNote);

        return Response.json(newNote, { status: 201 });
    } catch (error) {
        console.error('POST Error:', error);
        return Response.json(
            { error: 'Failed to create note' },
            { status: 500 }
        );
    }
}
