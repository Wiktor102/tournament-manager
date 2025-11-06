"use client";

import { Match } from "@/types/types";
import { useEffect, useState } from "react";

function MatchTimer({ match }: { match: Match }) {
	const initialElapsed = (() => {
		if (match.status === "finished" && match.startedAt && match.endedAt) {
			return match.endedAt - match.startedAt;
		}

		if (match.startedAt) {
			return Date.now() - match.startedAt;
		}

		return 0;
	})();

	const [currentTime, setCurrentTime] = useState(initialElapsed);

	useEffect(() => {
		if (match.status !== "live" || !match.startedAt) return;

		const interval = setInterval(() => {
			setCurrentTime(Date.now() - match.startedAt!);
		}, 1000);

		return () => clearInterval(interval);
	}, [match.startedAt, match.status]);

	if (match.status !== "live" && match.status !== "finished") return null;

	const minutes = Math.floor(currentTime / 60000);
	const seconds = Math.floor((currentTime % 60000) / 1000);

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default MatchTimer;
