// Client component for the end match button
"use client";

import { endMatch } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { redirect } from "next/navigation";
import { useTransition } from "react";

function EndMatchButton({ match }: { match: Match }) {
	const [isPending, startTransition] = useTransition();

	const handleEndMatch = () => {
		if (window.confirm("Czy na pewno chcesz zakończyć ten mecz?")) {
			startTransition(async () => {
				await endMatch(match.id);
				redirect("/admin");
			});
		}
	};

	return (
		<button onClick={handleEndMatch} disabled={(!match.resumedAt && match.mode === "2x10") || isPending}>
			{isPending ? "Kończenie..." : "Zakończ"}
		</button>
	);
}

export default EndMatchButton;
