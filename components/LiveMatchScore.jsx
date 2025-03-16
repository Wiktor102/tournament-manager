"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveMatchScore({ match: initialMatch }) {
	const [match, setMatch] = useState(initialMatch);
	const router = useRouter();

	useEffect(() => {
		// Set up event source for server-sent events
		const eventSource = new EventSource(`/api/matches/${match.id}/events`);

		eventSource.onmessage = event => {
			const updatedMatch = JSON.parse(event.data);
			setMatch(updatedMatch);
		};

		eventSource.onerror = () => {
			eventSource.close();

			// Fallback to polling if SSE fails
			const interval = setInterval(async () => {
				try {
					const res = await fetch(`/api/matches/${match.id}`);
					if (res.ok) {
						const data = await res.json();
						setMatch(data);
					}
				} catch (error) {
					console.error("Error polling for match updates", error);
				}
			}, 5000);

			return () => clearInterval(interval);
		};

		return () => eventSource.close();
	}, [match.id]);

	const getStatusDisplay = () => {
		switch (match.status) {
			case "scheduled":
				return "Upcoming";
			case "in-progress":
				return `Live - ${match.currentMinute}'`;
			case "finished":
				return "Final";
			default:
				return match.status;
		}
	};

	return (
		<div className="p-6">
			<div className="flex justify-center items-center mb-4">
				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.homeTeam}</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-4xl font-bold mb-2">
						{match.homeScore} - {match.awayScore}
					</div>
					<div
						className={`text-sm font-semibold px-3 py-1 rounded-full inline-block
            ${
				match.status === "in-progress"
					? "bg-red-600 text-white animate-pulse"
					: match.status === "finished"
					? "bg-gray-200"
					: "bg-blue-100"
			}`}
					>
						{getStatusDisplay()}
					</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.awayTeam}</div>
				</div>
			</div>
		</div>
	);
}
