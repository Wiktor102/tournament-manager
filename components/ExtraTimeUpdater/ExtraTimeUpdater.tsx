"use client";

import { updateMatchAdditionalTime } from "@/app/actions/matchActions";
import { Match } from "@/types/types";

function ExtraTimeUpdater({ match }: { match: Match }) {
	if (match.status !== "live") return null;

	function setAdditionalTime(e: FormData) {
		const amount = Number(e.get("amount"));
		if (amount < 0) return;

		updateMatchAdditionalTime(match.id, amount);
	}

	return (
		<form action={setAdditionalTime} className="set-additional-time">
			<label htmlFor="additional-time-amount">Dodatkowy czas: </label>
			<input type="number" name="amount" id="additional-time-amount" required />
			<button>Zatwierdź</button>
		</form>
	);
}

export default ExtraTimeUpdater;
