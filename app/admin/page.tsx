"use client";

import MatchForm from "@/components/MatchForm/MatchForm";
import "./AdminPage.scss";
import MatchesList from "@/components/MatchList/MatchesList";

export default function AdminPage() {
	return (
		<div className="admin-page">
			<h1 className="page-title">Zarządzanie turniejem</h1>

			<div className="add-match-container">
				<h2 className="section-title">Dodaj nowy mecz</h2>
				<MatchForm />
			</div>

			<div className="matches-container">
				<h2 className="section-title">Wszystkie mecze</h2>
				<MatchesList />
			</div>
		</div>
	);
}
