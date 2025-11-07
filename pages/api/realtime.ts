import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingMessage } from "http";
import { Server as NetServer } from "http";
import type { Socket } from "net";
import { WebSocketServer } from "ws";
import { addConnection, removeConnection, PLACEHOLDER_MATCH } from "@/app/lib/connectionsStore";
import { getMatch, getCurrentLiveMatch } from "@/app/actions/matchActions";
import type { Match } from "@/types/types";

type ExtendedNetServer = NetServer & {
	wss?: WebSocketServer;
};

type UpgradeRequest = IncomingMessage & {
	url?: string;
	headers: IncomingMessage["headers"] & { host?: string };
};

type SocketWithServer = Socket & {
	server: ExtendedNetServer;
};

async function resolveInitialMatch(channel: string): Promise<Match> {
	if (channel === "current") {
		return (await getCurrentLiveMatch()) ?? PLACEHOLDER_MATCH;
	}

	const match = await getMatch(channel);
	return match ?? PLACEHOLDER_MATCH;
}

function extractChannel(request: UpgradeRequest): string {
	const host = request.headers.host ?? "localhost";
	const url = new URL(request.url ?? "/api/realtime", `http://${host}`);
	const rawMatchId = url.searchParams.get("matchId") ?? "current";
	return rawMatchId === "current" ? "current" : rawMatchId;
}

async function attachWebsocketServer(server: ExtendedNetServer) {
	if (server.wss) {
		return;
	}

	const wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", (request: UpgradeRequest, socket, head) => {
		if (!request.url?.startsWith("/api/realtime")) {
			return;
		}

		wss.handleUpgrade(request, socket, head, ws => {
			wss.emit("connection", ws, request);
		});
	});

	wss.on("connection", async (socket, request: UpgradeRequest) => {
		const channel = extractChannel(request);
		const connectionId = addConnection(channel, socket);

		try {
			const initialMatch = await resolveInitialMatch(channel);
			socket.send(JSON.stringify({ type: "match:update", payload: initialMatch }));
		} catch (error) {
			console.error("Failed to fetch initial match state", error);
		}

		socket.on("close", () => {
			removeConnection(connectionId);
		});

		socket.on("error", () => {
			removeConnection(connectionId);
		});
	});

	server.wss = wss;
}

export const config = {
	api: {
		bodyParser: false
	}
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const socket = res.socket as SocketWithServer | undefined;
	const server = socket?.server;
	if (!server) {
		res.status(500).end("WebSocket server unavailable");
		return;
	}

	await attachWebsocketServer(server);
	res.status(200).end("WebSocket ready");
}
