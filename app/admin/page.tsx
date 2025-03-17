"use client";

import { getMatches, deleteMatch } from "@/lib/matches";
import MatchForm from "@/components/MatchForm/MatchForm";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Match {
	id: string;
	homeTeam: string;
	awayTeam: string;
	date: string;
	status: string;
}

export default function AdminPage() {
	const [matches, setMatches] = useState<Match[]>([]);

	useEffect(() => {
		const fetchMatches = async () => {
			const data = await getMatches();
			setMatches(data);
		};

		fetchMatches();
	}, []);

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">Match Management</h1>

			<div className="mb-8 bg-white p-6 rounded shadow">
				<h2 className="text-xl font-bold mb-4">Add New Match</h2>
				<MatchForm />
			</div>

			<div className="bg-white rounded shadow">
				<h2 className="text-xl font-bold p-4 border-b">All Matches</h2>

				{matches.length === 0 ? (
					<p className="p-4 text-gray-500">No matches have been added yet.</p>
				) : (
					<ul>
						{matches.map(match => (
							<li key={match.id} className="border-b last:border-b-0 p-4 flex justify-between items-center">
								<div>
									<div className="font-bold">
										{match.homeTeam} vs {match.awayTeam}
									</div>
									<div className="text-sm text-gray-600">{new Date(match.date).toLocaleString()}</div>
									<div className="text-sm text-gray-600">
										Status: <span className="capitalize">{match.status}</span>
									</div>
								</div>

								<div className="flex space-x-2">
									<Link
										href={`/admin/match/${match.id}`}
										className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
									>
										Live Score
									</Link>
									<Link
										href={`/admin/match/${match.id}/edit`}
										className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
									>
										Edit
									</Link>
									<form
										action={() => {
											deleteMatch(match.id);
										}}
									>
										<button
											type="submit"
											className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
											onClick={e => {
												if (!confirm("Are you sure you want to delete this match?")) {
													e.preventDefault();
												}
											}}
										>
											Delete
										</button>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
