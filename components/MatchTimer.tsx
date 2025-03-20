"use client";

import { Match } from "@/types/types";
import { useEffect, useState } from "react";

function MatchTimer({ match }: { match: Match }) {
	const [currentTime, setCurrentTime] = useState(() => {
		if (match.status === "finished" && match.endedAt) {
			// For finished matches, calculate the final duration
			return match.endedAt - (match.resumedAt ? match.resumedAt - 60 * 1000 * 10 : match.startedAt ?? 0);
		}

		return Date.now() - (match.resumedAt ? match.resumedAt + 60 * 1000 * 10 : match.startedAt ?? 0);
	});

	useEffect(() => {
		// Only set interval if match is live
		if (match.status !== "live") return;

		const interval = setInterval(() => {
			setCurrentTime(Date.now() - (match.resumedAt ? match.resumedAt - 60 * 1000 * 10 : match.startedAt ?? 0));
		}, 1000);

		return () => clearInterval(interval);
	}, [match.resumedAt, match.startedAt, match.status]);

	if (match.status === "half-time") return "przerwa";
	if (match.status === "penalties") return "Rzuty karne";
	if (match.status !== "live" && match.status !== "finished") return null;

	const minutes = Math.floor(currentTime / 60000);
	const seconds = Math.floor((currentTime % 60000) / 1000);

	let formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	if (match.addedTime > 0) {
		formattedTime += ` + ${match.addedTime}`;
	}

	return formattedTime;
}

export default MatchTimer;
