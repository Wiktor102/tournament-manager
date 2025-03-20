"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import "./Button.scss";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "primary" | "secondary" | "outline" | "destructive" | "link";
	size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = "default", size = "default", children, ...props }, ref) => {
		const buttonClasses = ["btn", `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(" ");

		return (
			<button className={buttonClasses} ref={ref} {...props}>
				{children}
			</button>
		);
	}
);

Button.displayName = "Button";

export { Button };
