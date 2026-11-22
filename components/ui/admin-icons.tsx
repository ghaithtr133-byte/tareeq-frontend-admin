import type { SVGProps } from "react";
import type { AdminNavigationId } from "@/lib/admin";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function PanelRightCloseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
      <path d="m10 9-3 3 3 3" />
    </svg>
  );
}

export function PanelRightOpenIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
      <path d="m8 9 3 3-3 3" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a2.75 2.75 0 0 0 3.7 3.7" />
      <path d="M9.4 5.3A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a16.5 16.5 0 0 1-3.3 4.3" />
      <path d="M6.4 6.7A16.7 16.7 0 0 0 2.5 12s3.5 7 9.5 7c1.6 0 3-.4 4.3-1" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function KeyRoundIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 5 6v6c0 4.6 3 7.8 7 9 4-1.2 7-4.4 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
      <path d="M4 13h4.5l1.5 2.5h4L15.5 13H20v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

export function NavigationIcon({ item, className = "size-[18px] shrink-0" }: { item: AdminNavigationId; className?: string }) {
  const props: IconProps = { ...baseProps, className };
  if (item === "dashboard") {
    return (
      <svg {...props}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
      </svg>
    );
  }
  if (item === "applications") {
    return (
      <svg {...props}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M8.5 9h7" />
        <path d="M8.5 13h7" />
        <path d="M8.5 17h4.5" />
      </svg>
    );
  }
  if (item === "inquiries") {
    return (
      <svg {...props}>
        <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16H9.5L5 20v-4A1.5 1.5 0 0 1 3.5 14.5v-8A1.5 1.5 0 0 1 5 5Z" />
        <path d="M8.5 9.5h7" />
        <path d="M8.5 12.5h4.5" />
      </svg>
    );
  }
  if (item === "countries") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.8 12h16.4" />
        <path d="M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5S14.4 18.1 12 20.5" />
        <path d="M12 3.5c-2.4 2.4-3.6 5.2-3.6 8.5s1.2 6.1 3.6 8.5" />
      </svg>
    );
  }
  if (item === "universities") {
    return (
      <svg {...props}>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M5.5 11.5v6.5" />
        <path d="M9.5 13v5" />
        <path d="M14.5 13v5" />
        <path d="M18.5 11.5v6.5" />
        <path d="M3.5 20h17" />
      </svg>
    );
  }
  if (item === "academic-majors") {
    return (
      <svg {...props}>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v16H6.5A2.5 2.5 0 0 0 4 21V6.5Z" />
        <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v16h5.5a2.5 2.5 0 0 1 2.5 1V6.5Z" />
      </svg>
    );
  }
  if (item === "cities") {
    return (
      <svg {...props}>
        <path d="M12 20s6-5.6 6-10.5a6 6 0 1 0-12 0C6 14.4 12 20 12 20Z" />
        <circle cx="12" cy="9.5" r="2.2" />
      </svg>
    );
  }
  if (item === "scholarships") {
    return (
      <svg {...props}>
        <path d="m3 9 9-4.5L21 9l-9 4.5L3 9Z" />
        <path d="M7 11.5v4.2c0 1.4 2.2 2.8 5 2.8s5-1.4 5-2.8v-4.2" />
        <path d="M21 9v5.5" />
      </svg>
    );
  }
  if (item === "services") {
    return (
      <svg {...props}>
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
        <path d="M4 12.5h16" />
      </svg>
    );
  }
  if (item === "articles") {
    return (
      <svg {...props}>
        <path d="M6 3.5h8.5L19 8v12.5H6z" />
        <path d="M14.5 3.5V8H19" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    );
  }
  if (item === "about") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
    );
  }
  if (item === "faqs") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.6 9.5a2.4 2.4 0 0 1 4.6.8c0 1.6-2.2 2-2.2 3.4" />
        <path d="M12 16.8h.01" />
      </svg>
    );
  }
  if (item === "analytics") {
    return (
      <svg {...props}>
        <path d="M5 19V11" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
        <path d="M3 19.5h18" />
      </svg>
    );
  }
  if (item === "audit-log") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 1.8" />
      </svg>
    );
  }
  if (item === "admins") {
    return (
      <svg {...props}>
        <circle cx="9.5" cy="8.5" r="3" />
        <path d="M4 19.5a5.5 5.5 0 0 1 11 0" />
        <path d="M16.5 9.5h4" />
        <path d="M18.5 7.5v4" />
      </svg>
    );
  }
  if (item === "change-password") {
    return <KeyRoundIcon className={className} />;
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.74 0-1.25.4-1.51 1Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function SlidersHorizontalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 6h-7" />
      <path d="M10 6H3" />
      <circle cx="12" cy="6" r="2" />
      <path d="M21 12h-3" />
      <path d="M14 12H3" />
      <circle cx="16" cy="12" r="2" />
      <path d="M21 18H9" />
      <path d="M5 18H3" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

export function RotateCcwIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <path d="m14 6 4 4" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m12 3.5 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3.5Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 16V5" />
      <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 16-5-5-4 4-2.5-2.5L3 19" />
    </svg>
  );
}

export function Settings2Icon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function BanIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

export function ZoomInIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function RefreshCwIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function MoreVerticalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="5.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2.5 5.5A2.5 2.5 0 0 1 5 3h5.5a1.5 1.5 0 0 1 1.5 1.5v15a2 2 0 0 0-2-2H5a2.5 2.5 0 0 0-2.5 2.5V5.5Z" />
      <path d="M21.5 5.5A2.5 2.5 0 0 0 19 3h-5.5A1.5 1.5 0 0 0 12 4.5v15a2 2 0 0 1 2-2h5a2.5 2.5 0 0 1 2.5 2.5V5.5Z" />
    </svg>
  );
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.5a2.4 2.4 0 0 1 4.6.8c0 1.6-2.2 2-2.2 3.4" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}



