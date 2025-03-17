"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch, updateMatch } from "@/app/actions/matchActions";
import "./MatchForm.scss";
import { Match, MatchData } from "@/types/types";

interface MatchFormProps {
	match?: Match;
}

export default function MatchForm({ match }: MatchFormProps) {
	const router = useRouter();
	const isEditing = !!match;

	if (match?.status === "finished") {
		throw new Error("Cannot edit finished match");
	}

	const [formData, setFormData] = useState<MatchData>({
		homeTeam: match?.team1 || "",
		awayTeam: match?.team2 || "",
		pitchId: match?.pitchId || 1,
		status: match?.status || "scheduled",
		date: ""
		// date: match?.currentTime ? match.date.slice(0, 16) : ""
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		try {
			if (isEditing) {
				if (match) {
					await updateMatch(match.id, formData);
					router.push("/admin");
				}
			} else {
				await createMatch(formData);

				// Clear form after successful submission
				setFormData({
					homeTeam: "",
					awayTeam: "",
					pitchId: 1,
					status: "scheduled",
					date: ""
				});
			}

			// Router refresh happens automatically because of revalidatePath
			// in the server action, but it doesn't hurt to call it again
			router.refresh();
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
				<label htmlFor="pitch">Boisko: </label>
				<select
					id="pitch"
					name="pitch"
					value={formData.pitchId}
					onChange={e => setFormData(prev => ({ ...prev, pitchId: +e.target.value as 1 | 2 }))}
					required
				>
					<option value="1">Boisko 1</option>
					<option value="2">Boisko 2</option>
				</select>
			</div>

			<div>
				<label htmlFor="status">Status: </label>
				<select
					id="status"
					name="status"
					value={formData.status}
					onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as "scheduled" | "live" }))}
					required
				>
					<option value="scheduled">Zaplanowany</option>
					<option value="live">LIVE (rozpocznij od razu)</option>
				</select>
			</div>

			<div>
				<button type="submit">{isEditing ? "Zaktualizuj mecz" : "Dodaj mecz"}</button>
			</div>
		</form>
	);
}
