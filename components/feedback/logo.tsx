"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

export const LogoIcon = ({
  className,
  uniColor,
  fill,
}: {
  className?: string
  uniColor?: boolean
  fill?: string
}) => {
  const gradientId = useId().replace(/:/g, "")
  const pathFill = fill ?? (uniColor ? "currentColor" : `url(#${gradientId})`)

  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M45 60.9399C17.01 92.6599 0 134.37 0 180C0 225.63 17.01 267.34 45 299.06V60.9399Z"
        fill={pathFill}
      />
      <path
        d="M315 299.06C342.99 267.33 360 225.63 360 180C360 134.37 342.99 92.6599 315 60.9399V299.06Z"
        fill={pathFill}
      />
      <path
        d="M90 100.63V24.0801C73.07 33.8801 57.86 46.3701 45 60.9401L90 100.63Z"
        fill={pathFill}
      />
      <path
        d="M270 259.37V335.91C286.93 326.11 302.14 313.62 315 299.05L270 259.36V259.37Z"
        fill={pathFill}
      />
      <path
        d="M180 0C164.46 0 149.38 1.97 135 5.67V140.31L180 180V0Z"
        fill={pathFill}
      />
      <path
        d="M270 259.37V24.0799C256.06 16.0199 240.98 9.77992 225 5.66992V219.69L270 259.38V259.37Z"
        fill={pathFill}
      />
      <path
        d="M135 140.31L90 100.62V335.91C103.94 343.97 119.03 350.21 135 354.32V140.3V140.31Z"
        fill={pathFill}
      />
      <path
        d="M225 219.69L180 180V360C195.54 360 210.62 358.03 225 354.33V219.69Z"
        fill={pathFill}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="180"
          y1="0"
          x2="180"
          y2="360"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B99FE" />
          <stop offset="1" stopColor="#2BC8B7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
