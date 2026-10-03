import {
  AlertCircle,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Globe,
  HelpCircle,
  History,
  Info,
  Link2Off,
  Loader2,
  Pencil,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { memo } from 'react';

import type { JSX, SVGProps } from 'react';

const ICONS = {
  AlertCircle,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Globe,
  HelpCircle,
  History,
  Info,
  Link2Off,
  Loader2,
  Pencil,
  Search,
  Settings,
  Trash2,
  X,
};

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  readonly name: IconName;
}

export const Icon = memo(({ name, className, ...props }: IconProps): JSX.Element => {
  const LucideIcon = ICONS[name];

  return <LucideIcon className={className} {...props} />;
});
