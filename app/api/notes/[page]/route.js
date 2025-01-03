// /app/api/notes/[page]/route.js
import { notes } from '../route';

const NOTES_PER_PAGE = 6;

export async function GET(request, context) {
    try {
        const params = await context.params;
        let page = parseInt(params.page, 10) || 1;
        
        // Sort notes by timestamp (newest first)
        const sortedNotes = [...notes].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        const maxPages = Math.max(1, Math.ceil(sortedNotes.length / NOTES_PER_PAGE));
        page = Math.max(1, Math.min(page, maxPages));
        
        const startIndex = (page - 1) * NOTES_PER_PAGE;
        const endIndex = startIndex + NOTES_PER_PAGE;
        const paginatedNotes = sortedNotes.slice(startIndex, endIndex);
        
        return Response.json({
            notes: paginatedNotes,
            currentPage: page,
            totalPages: maxPages,
            totalNotes: notes.length,
            hasNewNotes: false // Flag for polling updates
        });
    } catch (error) {
        console.error('Pagination Error:', error);
        return Response.json(
            { error: 'Failed to fetch notes' },
            { status: 500 }
        );
    }
}
