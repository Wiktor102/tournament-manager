import { getMatch } from "@/lib/matches";
import { notFound } from "next/navigation";
import LiveMatchScore from "@/components/LiveMatchScore";

export default async function MatchPage({ params }) {
	const match = await getMatch(params.id);

	if (!match) {
		notFound();
	}

	return (
		<div className="max-w-3xl mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold text-center mb-8">
				{match.homeTeam} vs {match.awayTeam}
			</h1>

			<div className="bg-white rounded-lg shadow-lg overflow-hidden">
				<div className="bg-green-700 text-white p-4 text-center">
					<div className="text-sm">
						{new Date(match.date).toLocaleDateString()} | {new Date(match.date).toLocaleTimeString()}
					</div>
				</div>

				<LiveMatchScore match={match} />

				<div className="p-4 text-center">
					<a href="/" className="text-blue-600 hover:underline">
						Back to all matches
					</a>
				</div>
			</div>
		</div>
	);
}
