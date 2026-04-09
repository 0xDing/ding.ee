import { useLocalStorageState } from 'ahooks'
import { useEffect } from 'react'
import { MoonIcon, SunIcon } from './AppIcon'

type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle('dark', theme === 'dark')
}

export default function ThemeToggle() {
	const [stored, setStored] = useLocalStorageState<Theme>('theme')
	const resolved = stored ?? getSystemTheme()

	useEffect(() => {
		applyTheme(resolved)
	}, [resolved])

	// Listen for system theme changes when no stored preference
	useEffect(() => {
		if (stored) return
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [stored])

	const toggle = () => {
		const next: Theme = resolved === 'dark' ? 'light' : 'dark'
		setStored(next)
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
			className="flex cursor-pointer items-center justify-center rounded-full text-subtle transition hover:text-foreground focus-visible:outline-none focus-visible:text-foreground">
			{resolved === 'dark' ? (
				<SunIcon className="size-5" />
			) : (
				<MoonIcon className="size-5" />
			)}
		</button>
	)
}
