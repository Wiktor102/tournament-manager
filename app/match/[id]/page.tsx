import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import StreamOverlayWidget from "./StreamOverlayWidget";
import Link from "next/link";

// styles
import "./StreamOverlay.scss";

export default async function StreamOverlay({ params }: { params: Promise<{ id: string }> }) {
	const { id: matchId } = await params;
	const initialMatch = await getMatch(matchId);
	if (!initialMatch) {
		notFound();
	}

	return (
		<div className="stream-overlay">
			<StreamOverlayWidget initialMatch={initialMatch} />
			<Link href="/" className="return-home">
				Powrót do strony głównej
			</Link>
		</div>
	);
}
