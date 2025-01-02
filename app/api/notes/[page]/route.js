import { notes } from '../route';

const NOTES_PER_PAGE = 6;

export async function GET(request, context) {
    try {
        const params = await context.params;
        let page = parseInt(params.page, 10) || 1;
        
        // Calculate max pages
        const maxPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
        
        // Clamp page number between 1 and maxPages
        page = Math.max(1, Math.min(page, maxPages));
        
        // Shuffle all notes
        const shuffledNotes = [...notes].sort(() => Math.random() - 0.5);
        
        // Calculate pagination
        const startIndex = (page - 1) * NOTES_PER_PAGE;
        const endIndex = startIndex + NOTES_PER_PAGE;
        const paginatedNotes = shuffledNotes.slice(startIndex, endIndex);
        
        return Response.json({
            notes: paginatedNotes,
            currentPage: page,
            totalPages: maxPages,
            totalNotes: notes.length
        });
    } catch (error) {
        console.error('Pagination Error:', error);
        return Response.json(
            { error: 'Failed to fetch notes' },
            { status: 500 }
        );
    }
}
