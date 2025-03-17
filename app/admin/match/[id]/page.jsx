import { getMatch } from "@/app/actions/matchActions";
import LiveScoreUpdater from "@/components/LiveScoreUpdater";
import { notFound } from "next/navigation";

export default async function LiveScorePage({ params }) {
	const match = await getMatch(params.id);

	if (!match) {
		notFound();
	}

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">
				Live Score: {match.homeTeam} vs {match.awayTeam}
			</h1>

			<div className="bg-white p-6 rounded shadow mb-4">
				<div className="text-sm text-gray-600 mb-2">Match Date: {new Date(match.date).toLocaleString()}</div>

				<div className="text-lg mb-4">
					Status: <span className="font-semibold capitalize">{match.status}</span>
				</div>

				<LiveScoreUpdater match={match} />
			</div>
		</div>
	);
}
