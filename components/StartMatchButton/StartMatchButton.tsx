"use client";

import { startMatch } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { useTransition } from "react";
import { Button } from "../ui/button";

interface StartMatchButtonProps {
	match: Match;
}

function StartMatchButton({ match }: StartMatchButtonProps) {
	const [isPending, startTransition] = useTransition();

	const handleStartMatch = () => {
		startTransition(async () => {
			await startMatch(match.id);
		});
	};

	return (
		<Button variant="primary" onClick={handleStartMatch} disabled={isPending}>
			{isPending ? "Rozpoczynanie..." : "Rozpocznij mecz"}
		</Button>
	);
}

export default StartMatchButton;
