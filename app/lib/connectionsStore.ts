import { v4 as uuid } from "uuid";
import { Match } from "@/types/types";
import { getCurrentLiveMatch } from "../actions/matchActions";

// Define a type for our global store
declare let global: {
	connectionStore: Map<string, ReadableStreamController<Uint8Array>> | undefined;
};

// Initialize the global connection store if it doesn't exist
if (!global.connectionStore) {
	global.connectionStore = new Map<string, ReadableStreamController<Uint8Array>>();
}

// Add a connection for a match
export function addConnection(matchId: string, controller: ReadableStreamController<Uint8Array>): string {
	const id = `${uuid()}#${matchId}`;
	global.connectionStore!.set(id, controller);
	console.log("Connection added", id, "Total connections:", global.connectionStore!.size);
	return id;
}

// Remove a connection
export function removeConnection(connectionId: string) {
	global.connectionStore!.delete(connectionId);
	console.log("Connection removed", connectionId, "Total connections:", global.connectionStore!.size);
}

// Get connections for a match
export function getConnections() {
	if (!global.connectionStore) {
		console.error("Global connection store is undefined!");
		global.connectionStore = new Map<string, ReadableStreamController<Uint8Array>>();
	}
	return global.connectionStore;
}

// Send update to all connections for a match
export async function sendMatchUpdate(matchId: string, data: Match, isCurrentMatchFn: (match: Match) => Promise<boolean>) {
	const connections = getConnections();
	// console.log("sendMatchUpdate called, connections:", connections.size, "keys:", Array.from(connections.keys()));

	// Send to specific match listeners
	for (const [key, controller] of connections.entries()) {
		try {
			// Send to both specific match listeners and "current" listeners.
			if (
				key.endsWith(`#${matchId}`) ||
				(key.endsWith("#current") &&
					((await isCurrentMatchFn(data)) || data.status === "finished" || data.status === "penalties"))
			) {
				const encoder = new TextEncoder();
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			}
		} catch (error) {
			console.error("Error sending update to connection", key, error);
			// Remove failed connections
			removeConnection(key);
		}
	}
}

// Send update to all connections when a match is deleted
export async function sendMatchDeleteUpdate(matchId: string) {
	// Get the new current match (if any)
	const nextCurrentMatch = await getCurrentLiveMatch();
	const encoder = new TextEncoder();
	const connections = getConnections();

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
					mode: "1x12",
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
