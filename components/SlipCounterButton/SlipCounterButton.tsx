"use client";

import { useState } from "react";
import { incrementSlipCount } from "@/app/actions/slipCounterActions";
import "./SlipCounterButton.scss";

export default function SlipCounterButton() {
	const [isUpdating, setIsUpdating] = useState(false);

	const handleIncrementSlipCount = async () => {
		setIsUpdating(true);
		try {
			await incrementSlipCount();
		} catch (error) {
			console.error("Error incrementing slip count:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<button className="slip-counter-button" onClick={handleIncrementSlipCount} disabled={isUpdating}>
			{isUpdating ? "Aktualizowanie..." : "Dodaj poślizgnięcie 🧊"}
		</button>
	);
}
