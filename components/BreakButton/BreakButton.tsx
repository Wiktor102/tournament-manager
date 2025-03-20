"use client";

import { startBreak, resumeFromBreak } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { useTransition } from "react";

function BreakButton({ match }: { match: Match }) {
	const [isPending, startTransition] = useTransition();

	const handleBreakAction = () => {
		if (match.status === "live") {
			// Starting a break
			if (window.confirm("Czy na pewno chcesz rozpocząć przerwę w meczu?")) {
				startTransition(async () => {
					await startBreak(match.id);
				});
			}
		} else if (match.status === "half-time") {
			// Ending a break
			if (window.confirm("Czy na pewno chcesz wznowić grę po przerwie?")) {
				startTransition(async () => {
					await resumeFromBreak(match.id);
				});
			}
		}
	};

	// Button is disabled if match is not live or in half-time
	const isDisabled = (match.status !== "live" && match.status !== "half-time") || isPending;

	// Dynamic button text based on match status and pending state
	let buttonText = match.status === "half-time" ? "Wznów grę" : "Przerwa";
	if (isPending) {
		buttonText = match.status === "half-time" ? "Wznawianie..." : "Rozpoczynanie przerwy...";
	}

	return (
		<button onClick={handleBreakAction} disabled={isDisabled}>
			{buttonText}
		</button>
	);
}

export default BreakButton;
