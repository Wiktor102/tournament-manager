"use client";

import { Match } from "@/types/types";
import { useEffect, useState } from "react";

function MatchTimer({ match }: { match: Match }) {
	const [currentTime, setCurrentTime] = useState(Date.now() - (match.resumedAt ?? match.startedAt ?? 0));

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Date.now() - (match.resumedAt ?? match.startedAt ?? 0));
		}, 1000);

		return () => clearInterval(interval);
	}, [match.resumedAt, match.startedAt]);

	if (match.status !== "live") return null;
	const minutes = Math.floor(currentTime / 60000);
	const seconds = Math.floor((currentTime % 60000) / 1000);

	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	return formattedTime;
}

export default MatchTimer;
