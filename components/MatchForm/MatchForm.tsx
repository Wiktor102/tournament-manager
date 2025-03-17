"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch, updateMatch } from "@/app/actions/matchActions";
import "./MatchForm.scss";
import { MatchData } from "@/types/types";

interface MatchFormProps {
	match?: MatchData;
}

export default function MatchForm({ match }: MatchFormProps) {
	const router = useRouter();
	const isEditing = !!match;

	const [formData, setFormData] = useState<MatchData>({
		homeTeam: match?.homeTeam || "",
		awayTeam: match?.awayTeam || "",
		pitchId: match?.pitchId || 1,
		date: match?.date ? match.date.slice(0, 16) : ""
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

			<div className="mt-4">
				<button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
					{isEditing ? "Update Match" : "Add Match"}
				</button>
			</div>
		</form>
	);
}
