import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import LiveMatchScore from "@/components/LiveMatchScore";
import Link from "next/link";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: matchId } = await params;
	const match = await getMatch(matchId);

	if (!match) {
		notFound();
	}

	return (
		<div className="max-w-3xl mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold text-center mb-8">
				{match.team1} vs {match.team2}
			</h1>
			<h1 className="text-3xl font-bold text-center mb-8">
				{match.score1} : {match.score2}
			</h1>

			<div className="bg-white rounded-lg shadow-lg overflow-hidden">
				<div className="bg-green-700 text-white p-4 text-center">
					<div className="text-sm">
						{/* {new Date(match.date).toLocaleDateString()} | {new Date(match.date).toLocaleTimeString()} */}
					</div>
				</div>

				<LiveMatchScore match={match} />

				<div className="p-4 text-center">
					<Link href="/" className="text-blue-600 hover:underline">
						Back to all matches
					</Link>
				</div>
			</div>
		</div>
	);
}
