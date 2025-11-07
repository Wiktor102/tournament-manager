import { v4 as uuid } from "uuid";
import type { WebSocket } from "ws";
import { Match } from "@/types/types";

type Connection = {
	id: string;
	channel: string;
	socket: WebSocket;
};

type ConnectionStore = Map<string, Connection>;

declare global {
	var __matchConnections: ConnectionStore | undefined;
}

const PLACEHOLDER_SETS: Match["sets"] = [
	{ setNumber: 1, targetPoints: 11, team1Points: 0, team2Points: 0, isTieBreak: false },
	{ setNumber: 2, targetPoints: 11, team1Points: 0, team2Points: 0, isTieBreak: false }
];

export const PLACEHOLDER_MATCH: Match = {
	id: "placeholder",
	team1: "",
	team2: "",
	status: "scheduled",
	rank: "1/16",
	format: "twoSetsTo11",
	sets: PLACEHOLDER_SETS,
	currentSet: 0,
	servingTeam: "team1",
	decidedByTotalPoints: false
};

function getStore(): ConnectionStore {
	if (!globalThis.__matchConnections) {
		globalThis.__matchConnections = new Map();
	}
	return globalThis.__matchConnections;
}

function isOpen(socket: WebSocket) {
	return socket.readyState === socket.OPEN;
}

function safeSend(connectionId: string, connection: Connection, payload: string) {
	if (!isOpen(connection.socket)) {
		getStore().delete(connectionId);
		return;
	}

	try {
		connection.socket.send(payload);
	} catch (error) {
		console.error("Error sending realtime payload", error);
		getStore().delete(connectionId);
	}
}

export function addConnection(channel: string, socket: WebSocket): string {
	const id = `${uuid()}#${channel}`;
	getStore().set(id, { id, channel, socket });
	return id;
}

export function removeConnection(connectionId: string) {
	const connection = getStore().get(connectionId);
	if (connection && isOpen(connection.socket)) {
		try {
			connection.socket.close();
		} catch (error) {
			console.error("Error closing websocket connection", error);
		}
	}
	getStore().delete(connectionId);
}

export function getConnections(): ConnectionStore {
	return getStore();
}

export function broadcastMatchUpdate(matchId: string, match: Match, options: { isCurrentMatch: boolean }) {
	const payload = JSON.stringify({ type: "match:update", payload: match });
	for (const [id, connection] of getStore()) {
		const shouldNotifySpecific = connection.channel === matchId;
		const shouldNotifyCurrent =
			connection.channel === "current" && (options.isCurrentMatch || match.status === "finished");
		if (shouldNotifySpecific || shouldNotifyCurrent) {
			safeSend(id, connection, payload);
		}
	}
}

export function broadcastMatchDeletion(matchId: string, nextCurrentMatch?: Match) {
	const deletionMessage = JSON.stringify({ type: "match:deleted", payload: { matchId } });
	const nextMatch = nextCurrentMatch ?? PLACEHOLDER_MATCH;
	const nextMatchMessage = JSON.stringify({ type: "match:update", payload: nextMatch });

	for (const [id, connection] of getStore()) {
		if (connection.channel === matchId) {
			safeSend(id, connection, deletionMessage);
			continue;
		}

		if (connection.channel === "current") {
			safeSend(id, connection, nextMatchMessage);
		}
	}
}
