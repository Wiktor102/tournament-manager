"use server";

import MatchForm from "@/components/MatchForm/MatchForm";
import "./AdminPage.scss";
import MatchesList from "@/components/MatchList/MatchesList";
import { getMatches } from "../actions/matchActions";

export default async function AdminPage() {
	const matches = await getMatches();

	return (
		<div className="admin-page">
			<h1 className="page-title">Zarządzanie turniejem</h1>

			<div className="add-match-container">
				<h2 className="section-title">Dodaj nowy mecz</h2>
				<MatchForm />
			</div>

			<div className="matches-container">
				<h2 className="section-title">Wszystkie mecze</h2>
				<MatchesList matches={matches} />
			</div>
		</div>
	);
}
