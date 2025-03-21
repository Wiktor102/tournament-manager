"use client";

import { endMatch } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "../ui/Button";

function EndMatchButton({ match }: { match: Match }) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleEndMatch = () => {
		if (window.confirm("Czy na pewno chcesz zakończyć ten mecz?")) {
			startTransition(async () => {
				await endMatch(match.id);
				router.push("/admin");
			});
		}
	};

	return (
		<Button
			variant="destructive"
			onClick={handleEndMatch}
			disabled={(!match.resumedAt && match.mode === "2x10") || isPending}
		>
			{isPending ? "Kończenie..." : "Zakończ"}
		</Button>
	);
}

export default EndMatchButton;
