import type * as React from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

export function GlobeIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M12 21C16.9706 21 21 16.9705 21 12C21 7.02942 16.9706 3 12 3C7.02943 3 3 7.02942 3 12C3 16.9705 7.02943 21 12 21Z"
				stroke="currentColor"
			/>
			<path
				d="M3.90002 15.1435C5.08439 15.6185 5.93699 15.6185 6.45778 15.1435C7.23898 14.4311 6.56488 12.269 7.65896 11.6727C8.753 11.0764 10.4199 13.7196 11.9779 12.8499C13.5358 11.9802 11.8311 9.66105 12.9123 8.72086C13.9934 7.78068 15.3993 8.84101 15.6451 7.26894C15.8908 5.69688 14.4985 6.3787 14.2313 4.89313C14.0532 3.90276 14.0532 3.38199 14.2313 3.33081"
				stroke="currentColor"
				strokeLinecap="round"
			/>
			<path
				d="M19.9999 16C19.9999 16 18.5 14.5 16.9999 14C15.4999 13.5 14.4999 15 14.4999 16C14.4999 17 14.5 17 13.4999 18C12.9999 18.5 13.5 20 13.9999 20.5"
				stroke="currentColor"
				strokeLinecap="round"
			/>
		</svg>
	)
}

export function CheckIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path d="M21 6L8.625 18L3 12.5454" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function ChevronRightIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path d="M9.5 6L15.5 12L9.5 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function MoonIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M20.354 15.354A9 9 0 0 1 8.646 3.646a9 9 0 1 0 11.708 11.708Z"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function SunIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
			<path d="M12 2.5V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M12 19V21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M4.93 4.93 6.7 6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M17.3 17.3 19.07 19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M2.5 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M19 12h2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M4.93 19.07 6.7 17.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
			<path d="M17.3 6.7 19.07 4.93" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}
