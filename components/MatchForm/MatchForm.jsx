"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch, updateMatch } from "@/app/actions/matchActions";
import "./MatchForm.scss";

export default function MatchForm({ match }) {
	const router = useRouter();
	const isEditing = !!match;

	const [formData, setFormData] = useState({
		homeTeam: match?.homeTeam || "",
		awayTeam: match?.awayTeam || "",
		date: match?.date ? match.date.slice(0, 16) : ""
	});

	const handleChange = e => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async e => {
		e.preventDefault();

		try {
			if (isEditing) {
				await updateMatch(match.id, formData);
				router.push("/admin");
			} else {
				await createMatch(formData);
				// Clear form after successful submission
				setFormData({
					homeTeam: "",
					awayTeam: "",
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
		<form className="add-match-form" onSubmit={handleSubmit}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
					<label htmlFor="date" className="block text-sm font-medium mb-1">
						Date and Time
					</label>
					<input
						type="datetime-local"
						id="date"
						name="date"
						value={formData.date}
						onChange={handleChange}
						className="w-full p-2 border rounded"
						required
					/>
				</div>
			</div>

			<div className="mt-4">
				<button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
					{isEditing ? "Update Match" : "Add Match"}
				</button>
			</div>
		</form>
	);
}
