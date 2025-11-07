"use client";

import { Match } from "@/types/types";

function PenaltyButton({ match }: { match: Match }) {
	void match;
	// Volleyball format does not rely on penalty shootouts.
	return null;
}

export default PenaltyButton;
