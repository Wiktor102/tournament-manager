import { getMatch } from "@/app/actions/matchActions";
import { NextRequest, NextResponse } from "next/server";

// Connection store - in a real app, use Redis or similar
const connections = new Map<string, ReadableStreamController<Uint8Array>>();

// Add a connection for a match
export function addConnection(matchId: string, controller: ReadableStreamController<Uint8Array>) {
	if (!connections.has(matchId)) {
		connections.set(matchId, controller);
	}
}

// Remove a connection
export function removeConnection(matchId: string) {
	connections.delete(matchId);
}

// Send update to all connections for a match
export function sendUpdate(matchId: string, data: unknown) {
	const controller = connections.get(matchId);
	if (controller) {
		const encoder = new TextEncoder();
		controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	const matchId = request.nextUrl.searchParams.get("matchId");

	if (!matchId) {
		return new NextResponse("Match ID is required", { status: 400 });
	}

	// Check if the match exists
	const match = await getMatch(matchId);
	if (!match) {
		return new NextResponse("Match not found", { status: 404 });
	}

	// Set up SSE response
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			addConnection(matchId, controller);

			// Send initial data
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(match)}\n\n`));
		},
		cancel() {
			removeConnection(matchId);
		}
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive"
		}
	});
}
