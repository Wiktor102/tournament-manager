import { useEffect, useState } from "react";
import { Match } from "@/types/types";
import { getMatch } from "@/app/actions/matchActions";

function useLiveMatch(initialMatch: Match) {
	const [match, setMatch] = useState<Match>(initialMatch);

	useEffect(() => {
		// Set up event source for server-sent events
		const eventSource = new EventSource(`/api/events?matchId=${match.id}`);

		eventSource.onmessage = (event: MessageEvent) => {
			const updatedMatch: Match = JSON.parse(event.data);
			setMatch(updatedMatch);
		};

		eventSource.onerror = () => {
			eventSource.close();

			// Fallback to polling if SSE fails
			console.warn("Server-sent events failed, falling back to polling");
			const interval = setInterval(async () => {
				try {
					const data = await getMatch(match.id);
					if (!data) throw new Error("Match not found");
					setMatch(data);
				} catch (error) {
					console.error("Error polling for match updates", error);
				}
			}, 5000);

			return () => clearInterval(interval);
		};

		return () => eventSource.close();
	}, [match.id]);

	return match;
}

export default useLiveMatch;
