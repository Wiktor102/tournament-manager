"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch } from "@/app/actions/matchActions";
import "./MatchForm.scss";
import { InitialMatchData } from "@/types/types";

export default function MatchForm() {
	const router = useRouter();

	const initialData: InitialMatchData = {
		homeTeam: "",
		awayTeam: "",
		rank: "",
		mode: "1x15"
	};
	const [formData, setFormData] = useState<InitialMatchData>(initialData);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		try {
			const createdMatch = await createMatch(formData);
			setFormData(initialData); // Clear form
			router.push(`/admin/match/${createdMatch.id}`);
		} catch (error) {
			console.error("Error submitting form:", error);
		}
	};

	return (
		<form className="add-match-form" action={handleSubmit}>
			<div className="teams-picker">
				<input
					type="text"
					id="homeTeam"
					name="homeTeam"
					value={formData.homeTeam}
					onChange={handleChange}
					className="w-full p-2 border rounded"
					required
				/>

				<span>VS</span>

				<input
					type="text"
					id="awayTeam"
					name="awayTeam"
					value={formData.awayTeam}
					onChange={handleChange}
					className="w-full p-2 border rounded"
					required
				/>
			</div>

			<div>
				<label htmlFor="rank">Ranga rozgrywki: </label>
				<select
					id="rank"
					name="rank"
					value={formData.rank}
					onChange={e => setFormData(prev => ({ ...prev, rank: e.target.value }))}
					required
				>
					<option value="1/16">1/16</option>
					<option value="1/8">1/8</option>
					<option value="1/4">1/4</option>
					<option value="1/2">1/2</option>
					<option value="Finał">Finał</option>
					<option value="O 3 miejsce">O 3 miejsce</option>
				</select>
			</div>
			<div>
				<label htmlFor="mode">Tryb rozgrywki: </label>
				<select
					id="mode"
					name="mode"
					value={formData.mode}
					onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value as "1x15" | "2x10" }))}
					required
				>
					<option value="1x15">1x 15 min</option>
					<option value="2x10">2x 10 min</option>
				</select>
			</div>

			<div>
				<button type="submit">Dodaj i rozpocznij mecz</button>
			</div>
		</form>
	);
}
