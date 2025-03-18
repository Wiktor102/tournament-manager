"use client";

import { useState, useEffect } from "react";
import { Match } from "../types/types";
import { getMatchStatus } from "@/lib/matchUtils";
import { getMatch } from "@/app/actions/matchActions";

interface LiveMatchScoreProps {
	match: Match;
}

export default function LiveMatchScore({ match: initialMatch }: LiveMatchScoreProps) {
	const [match, setMatch] = useState<Match>(initialMatch);
	const [statusText, statusColor] = getMatchStatus(match);

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

	return (
		<div className="p-6">
			<div className="flex justify-center items-center mb-4">
				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.team1}</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-4xl font-bold mb-2">
						{match.score1} - {match.score2}
					</div>
					<div className="match-status">
						Status:{" "}
						<span className="status-value" style={{ backgroundColor: `var(--${statusColor})` }}>
							{statusText}
						</span>
					</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.team2}</div>
				</div>
			</div>
		</div>
	);
}
