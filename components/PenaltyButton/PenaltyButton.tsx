"use client";

import { Match } from "@/types/types";
import { startPenalties } from "@/app/actions/matchActions";
import { Button } from "../ui/Button";

interface PenaltyButtonProps {
	match: Match;
}

function PenaltyButton({ match }: PenaltyButtonProps) {
	const handlePenalties = async () => {
		if (confirm("Czy na pewno chcesz rozpocząć rzuty karne?")) {
			await startPenalties(match.id);
		}
	};

	return (
		<Button variant="destructive" onClick={handlePenalties} className="penalty-button">
			Rozpocznij rzuty karne
		</Button>
	);
}

export default PenaltyButton;
