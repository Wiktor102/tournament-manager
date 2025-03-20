import { useEffect, useState, useRef } from "react";
import { Match } from "@/types/types";
import { getMatch, getCurrentLiveMatch } from "@/app/actions/matchActions";

type LiveMatch = Match & { _deleted?: boolean };
function useLiveMatch(initialMatch: Match, isCurrent: boolean = false) {
	const [match, setMatch] = useState<LiveMatch>(initialMatch);
	const [isDeleted, setIsDeleted] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const isPlaceholder = initialMatch.id === "placeholder";

	// Clean up function to handle both eventSource and polling interval
	const cleanUp = () => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	// Setup SSE connection
	useEffect(() => {
		const matchIdForEvents = isCurrent || isPlaceholder ? "current" : initialMatch.id;
		eventSourceRef.current = new EventSource(`/api/events?matchId=${matchIdForEvents}`);

		// Regular updates
		eventSourceRef.current.onmessage = (event: MessageEvent) => {
			const updatedMatch: Match = JSON.parse(event.data);
			if (updatedMatch) setMatch(updatedMatch);
		};

		// Handle match deletion events
		eventSourceRef.current.addEventListener("matchDeleted", (event: MessageEvent) => {
			const deletedMatchId = event.data;

			if (!isCurrent && deletedMatchId === initialMatch.id) {
				// This specific match was deleted
				setIsDeleted(true);
				// Add a deleted flag to the match
				setMatch(prevMatch => ({
					...prevMatch,
					_deleted: true
				}));
			}
			// For "current" mode, we'll automatically receive the next match or placeholder
		});

		eventSourceRef.current.onerror = () => {
			// Close the erroring connection
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}

			// Fallback to polling if SSE fails
			console.warn("Server-sent events failed, falling back to polling");

			// Set up polling as fallback
			intervalRef.current = setInterval(async () => {
				try {
					let data;
					// For placeholder or current mode, poll for current matches
					if (isCurrent || isPlaceholder) {
						data = await getCurrentLiveMatch();
						// Only update if we got a real match
						if (data) {
							setMatch(data);
						}
					} else {
						// For a specific match, just update the current data
						data = await getMatch(initialMatch.id);
						if (data) {
							setMatch(data);
						}
					}
				} catch (error) {
					console.error("Error polling for match updates", error);
				}
			}, 5000); // Poll every 5 seconds
		};

		return cleanUp;
	}, [initialMatch.id, isCurrent, isPlaceholder]);

	return { match, isDeleted };
}

export default useLiveMatch;
