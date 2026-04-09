import { Globe } from 'lucide-react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/uikit/components/dropdown-menu'
import { cn } from '@/uikit/lib/utils'

type LocaleItem = {
	href: string
	label: string
	active: boolean
}

type LanguageDropdownProps = {
	label: string
	items: LocaleItem[]
}

export default function LanguageDropdown({ label, items }: LanguageDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				aria-label={label}
				className="flex cursor-pointer items-center justify-center rounded-full text-subtle transition hover:text-foreground focus-visible:outline-none focus-visible:text-foreground">
				<Globe className="size-5" strokeWidth={1.8} />
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" sideOffset={4} className="min-w-38 rounded-2xl p-2">
				{items.map(item => (
					<DropdownMenuItem
						key={item.href}
						render={props => (
							<a {...props} href={item.href}>
								{item.label}
							</a>
						)}
						className={cn(
							'rounded-xl px-4 py-3 text-sm font-medium no-underline outline-hidden transition',
							item.active
								? 'bg-accent text-primary data-highlighted:bg-accent data-highlighted:text-primary'
								: 'text-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground'
						)}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
