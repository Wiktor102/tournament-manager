"use server";

import { getMatch, getMatches } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";
import { addConnection, removeConnection, getConnections } from "@/app/lib/connectionsStore";

// Get current live match
async function getCurrentLiveMatch(): Promise<Match | undefined> {
	const matches = await getMatches();
	const liveMatches = matches.filter(
		match => match.status === "live" || match.status === "half-time" || match.status === "penalties"
	);

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
			const connectionIds = Array.from(getConnections().keys()).filter(key => key.endsWith(`#${initialMatchId}`));
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
