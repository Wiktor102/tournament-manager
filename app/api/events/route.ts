import { getMatch, getMatches } from "@/app/actions/matchActions";
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
export async function sendMatchUpdate(matchId: string, data: Match) {
	// Send to specific match listeners
	for (const [key, controller] of connections.entries()) {
		// Send to both specific match listeners and "current" listeners if this is the current match
		if (key.endsWith(`#${matchId}`) || (key.endsWith("#current") && (await isCurrentMatch(data)))) {
			const encoder = new TextEncoder();
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
		}
	}
}

// Send update to all connections when a match is deleted
export async function sendMatchDeleteUpdate(matchId: string) {
	// Get the new current match (if any)
	const nextCurrentMatch = await getCurrentLiveMatch();
	const encoder = new TextEncoder();

	for (const [key, controller] of connections.entries()) {
		if (key.endsWith(`#${matchId}`)) {
			// For connections listening to the specific deleted match
			// Send a deletion event
			controller.enqueue(encoder.encode(`event: matchDeleted\ndata: ${matchId}\n\n`));
		} else if (key.endsWith("#current")) {
			if (nextCurrentMatch) {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(nextCurrentMatch)}\n\n`));
			} else {
				const placeholder = {
					id: "placeholder",
					team1: "",
					team2: "",
					score1: 0,
					score2: 0,
					mode: "1x15",
					rank: "1/?",
					status: "scheduled",
					currentTime: "0",
					addedTime: 0
				};
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(placeholder)}\n\n`));
			}
		}
	}
}

// Function to check if a match is the current (most recent live) match
async function isCurrentMatch(match: Match): Promise<boolean> {
	const matches = await getMatches();
	const liveMatches = matches.filter(m => m.status === "live" || match.status === "half-time");

	if (liveMatches.length === 0) return false;

	// Sort by startedAt (most recent first)
	const sortedMatches = liveMatches.sort((a, b) => {
		const timeA = a.startedAt || 0;
		const timeB = b.startedAt || 0;
		return timeB - timeA;
	});

	// Check if this match is the most recent live match
	return sortedMatches[0].id === match.id;
}

// Get current live match
async function getCurrentLiveMatch(): Promise<Match | undefined> {
	const matches = await getMatches();
	const liveMatches = matches.filter(match => match.status === "live" || match.status === "half-time");

	if (liveMatches.length === 0) {
		return undefined;
	}

	// Sort by startedAt (most recent first) and take the first one
	return liveMatches.sort((a, b) => {
		const timeA = a.startedAt || 0;
		const timeB = b.startedAt || 0;
		return timeB - timeA;
	})[0];
}

export async function GET(request: NextRequest) {
	const matchId = request.nextUrl.searchParams.get("matchId");

	if (!matchId) {
		return new NextResponse("Match ID is required", { status: 400 });
	}

	// Check if we're looking for the current match
	let match: Match | undefined;

	if (matchId === "current") {
		// Get the current match
		match = await getCurrentLiveMatch();

		// If no live match found, instead of returning an error,
		// we'll set up an SSE connection that will be updated when a match is created
		if (!match) {
			// Create a placeholder response
			match = {
				id: "placeholder",
				team1: "",
				team2: "",
				score1: 0,
				score2: 0,
				mode: "1x15",
				rank: "1/?",
				status: "scheduled",
				currentTime: "0",
				addedTime: 0
			};
		}
	} else {
		// Normal match lookup
		match = await getMatch(matchId);
		if (!match) {
			return new NextResponse("Match not found", { status: 404 });
		}
	}

	// Set up SSE response
	const encoder = new TextEncoder();
	const initialMatchId = matchId === "current" ? "current" : match.id;

	const stream = new ReadableStream({
		start(controller) {
			addConnection(initialMatchId, controller);
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(match)}\n\n`));
		},
		cancel() {
			const connectionIds = Array.from(connections.keys()).filter(key => key.endsWith(`#${initialMatchId}`));
			for (const id of connectionIds) removeConnection(id);
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
