// /app/api/notes/route.js
export let notes = [];

const MAX_CONTENT_LENGTH = 1000;
const MAX_NOTES = 1000;
const NOTES_PER_PAGE = 6;

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
        // Return notes sorted by timestamp (newest first)
        const sortedNotes = [...notes].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        return Response.json({
            notes: sortedNotes.slice(0, NOTES_PER_PAGE),
            total: notes.length,
            totalPages: Math.ceil(notes.length / NOTES_PER_PAGE)
        });
    } catch (error) {
        console.error('GET Error:', error);
        return Response.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        
        if (!data.content?.trim() || !data.author?.trim()) {
            return Response.json(
                { error: 'Content and author are required' },
                { status: 400 }
            );
        }

        if (data.content.length > MAX_CONTENT_LENGTH) {
            return Response.json(
                { error: 'Content too long' },
                { status: 400 }
            );
        }

        if (notes.length >= MAX_NOTES) {
            notes.pop();
        }

        const newNote = {
            id: Date.now().toString(),
            content: sanitizeInput(data.content.trim()),
            author: sanitizeInput(data.author.trim()),
            timestamp: new Date().toISOString(),
        };

        notes.unshift(newNote);

        return Response.json({
            note: newNote,
            totalPages: Math.ceil(notes.length / NOTES_PER_PAGE)
        }, { status: 201 });
    } catch (error) {
        console.error('POST Error:', error);
        return Response.json(
            { error: 'Failed to create note' },
            { status: 500 }
        );
    }
}
