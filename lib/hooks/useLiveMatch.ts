import { useEffect, useState, useRef, useCallback } from "react";
import { Match } from "@/types/types";
import { getMatch, getCurrentLiveMatch } from "@/app/actions/matchActions";

type LiveMatch = Match & { _deleted?: boolean };

type RealtimeMessage = { type: "match:update"; payload: Match } | { type: "match:deleted"; payload: { matchId: string } };

function useLiveMatch(initialMatch: Match, isCurrent: boolean = false) {
	const [match, setMatch] = useState<LiveMatch>(initialMatch);
	const [isDeleted, setIsDeleted] = useState(false);
	const socketRef = useRef<WebSocket | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const isPlaceholder = initialMatch.id === "placeholder";

	const clearFallback = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const cleanUp = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.onclose = null;
			socketRef.current.onerror = null;
			socketRef.current.onmessage = null;
			socketRef.current.close();
			socketRef.current = null;
		}

		clearFallback();
	}, [clearFallback]);

	const startPollingFallback = useCallback(() => {
		if (intervalRef.current) return;

		intervalRef.current = setInterval(async () => {
			try {
				if (isCurrent || isPlaceholder) {
					const data = await getCurrentLiveMatch();
					if (data) {
						setIsDeleted(false);
						setMatch(data);
					}
				} else {
					const data = await getMatch(initialMatch.id);
					if (data) {
						setMatch(data);
					}
				}
			} catch (error) {
				console.error("Error polling for match updates", error);
			}
		}, 5000);
	}, [initialMatch.id, isCurrent, isPlaceholder]);

	useEffect(() => {
		let cancelled = false;

		const initialise = async () => {
			try {
				await fetch("/api/realtime");
			} catch (error) {
				console.warn("Unable to warm up realtime endpoint", error);
			}

			if (cancelled) return;

			const matchIdForEvents = isCurrent || isPlaceholder ? "current" : initialMatch.id;
			const protocol = window.location.protocol === "https:" ? "wss" : "ws";
			const socket = new WebSocket(`${protocol}://${window.location.host}/api/realtime?matchId=${matchIdForEvents}`);

			socketRef.current = socket;

			socket.onmessage = event => {
				try {
					const message = JSON.parse(event.data) as RealtimeMessage;
					if (message.type === "match:update") {
						setIsDeleted(false);
						setMatch(message.payload);
					} else if (message.type === "match:deleted" && !isCurrent) {
						if (message.payload.matchId === initialMatch.id) {
							setIsDeleted(true);
							setMatch(prevMatch => ({ ...prevMatch, _deleted: true }));
						}
					}
				} catch (error) {
					console.error("Failed to parse realtime message", error);
				}
			};

			socket.onerror = () => {
				socket.close();
			};

			socket.onclose = () => {
				if (cancelled) return;
				socketRef.current = null;
				startPollingFallback();
			};
		};

		initialise();

		return () => {
			cancelled = true;
			cleanUp();
		};
	}, [cleanUp, initialMatch.id, isCurrent, isPlaceholder, startPollingFallback]);

	return { match, isDeleted };
}

export default useLiveMatch;
