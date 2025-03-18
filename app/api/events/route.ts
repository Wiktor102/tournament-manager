import { getMatch } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

// Connection store - in a real app, use Redis or similar
const connections = new Map<string, ReadableStreamController<Uint8Array>>();

// Add a connection for a match
export function addConnection(matchId: string, controller: ReadableStreamController<Uint8Array>): string {
	const id = `${uuid()}#${matchId}`;
	connections.set(id, controller);
	return id;
}

// Remove a connection
export function removeConnection(connectionId: string) {
	connections.delete(connectionId);
}

// Send update to all connections for a match
export function sendMatchUpdate(matchId: string, data: Match) {
	for (const [key, controller] of connections.entries()) {
		if (key.endsWith(`#${matchId}`)) {
			const encoder = new TextEncoder();
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
		}
	}
}

export async function GET(request: NextRequest) {
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
