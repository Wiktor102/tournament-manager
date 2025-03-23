import { getMatch, getCurrentLiveMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import StreamOverlayWidget from "./StreamOverlayWidget";
import Link from "next/link";
import SlipCounter from "@/components/SlipCounter/SlipCounter";

// styles
import "./StreamOverlay.scss";

export default async function StreamOverlay({ params }: { params: Promise<{ id: string }> }) {
	const { id: matchId } = await params;

	// For "current" matches, we have 2 possible scenarios:
	if (matchId === "current") {
		const initialMatch = await getCurrentLiveMatch();

		// We always render the widget, even if no match is available
		return (
			<div className="stream-overlay">
				<StreamOverlayWidget initialMatch={initialMatch} isCurrent={true} noMatchAvailable={!initialMatch} />
				<SlipCounter />
			</div>
		);
	}

	// For specific match IDs, handle normally
	const initialMatch = await getMatch(matchId);
	if (!initialMatch) {
		notFound();
	}

	return (
		<div className="stream-overlay">
			<StreamOverlayWidget initialMatch={initialMatch} />
			<SlipCounter />
			<Link href="/" className="return-home">
				Powrót do strony głównej
			</Link>
		</div>
	);
}
