import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/uikit/components/tooltip'
import { cn } from '@/uikit/lib/utils'

type HeroSocialLinksProps = {
	links: Array<{
		href: string
		iconSrc: string
		iconDarkSrc?: string
		iconClassName?: string
		label: string
	}>
}

export default function HeroSocialLinks({ links }: HeroSocialLinksProps) {
	return (
		<TooltipProvider delay={100}>
			<div className="[&:hover_.hero-social-link:not(:hover)]:opacity-50 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
				{links.map(({ href, iconSrc, iconDarkSrc, iconClassName, label }) => (
					<Tooltip key={href}>
						<TooltipTrigger
							render={props => (
								<a
									{...props}
									href={href}
									target="_blank"
									rel="noreferrer noopener me"
									aria-label={label}
									className={cn(
										'hero-social-link flex items-center justify-start p-0 text-ink no-underline transition-opacity duration-200 focus-visible:outline-none',
										props.className
									)}>
									<span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-card shadow-md">
										<span className={cn('size-6', iconClassName)}>
											<img src={iconSrc} alt="" aria-hidden="true" className={iconDarkSrc ? 'size-full dark:hidden' : 'size-full'} />
											{iconDarkSrc && <img src={iconDarkSrc} alt="" aria-hidden="true" className="hidden size-full dark:block" />}
										</span>
									</span>
								</a>
							)}
						/>
						<TooltipContent
							sideOffset={8}
							className="rounded-[10px] bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-[0_14px_28px_rgba(15,18,25,0.18)]">
							{label}
						</TooltipContent>
					</Tooltip>
				))}
			</div>
		</TooltipProvider>
	)
}
