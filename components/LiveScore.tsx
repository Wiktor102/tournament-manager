"use client";

import { useEffect, useState } from "react";
import { Match } from "@/types/types";

export default function LiveScore({ matchId, initialData }: { matchId: string; initialData: Match }) {
	const [match, setMatch] = useState<Match>(initialData);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// Connect to SSE endpoint
		const eventSource = new EventSource(`/api/events?matchId=${matchId}`);

		eventSource.onopen = () => {
			setIsConnected(true);
		};

		eventSource.onmessage = event => {
			try {
				const updatedMatch = JSON.parse(event.data);
				setMatch(updatedMatch);
			} catch (error) {
				console.error("Failed to parse match update", error);
			}
		};

		eventSource.onerror = () => {
			setIsConnected(false);
			eventSource.close();
			// Try to reconnect after a delay
			setTimeout(() => {
				window.location.reload();
			}, 5000);
		};

		return () => {
			eventSource.close();
		};
	}, [matchId]);

	return (
		<div className="live-score">
			<div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
				{isConnected ? "Live Updates Active" : "Connecting..."}
			</div>

			<div className="match-header">
				<h2>
					{match.teamHome} vs {match.teamAway}
				</h2>
				{match.status === "live" && <div className="live-badge">LIVE</div>}
			</div>

			<div className="score-display">
				<span className="team">{match.teamHome}</span>
				<span className="score">
					{match.scoreHome} - {match.scoreAway}
				</span>
				<span className="team">{match.teamAway}</span>
			</div>

			{match.currentTime && <div className="match-time">{match.currentTime}</div>}

			<div className="match-status">
				{match.status === "scheduled" && "Upcoming Match"}
				{match.status === "finished" && "Final Score"}
			</div>
		</div>
	);
}
