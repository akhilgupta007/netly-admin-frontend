import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CardWrapper({ 
  name, 
  value, 
  subtext, 
  icon: Icon, 
  href, 
  className,
  ...props 
}) {
  const Component = href ? Link : "div";
  const linkProps = href ? { href } : {};

  return (
    <Component
      {...linkProps}
      {...props}
      className={cn(
        "bg-white rounded-2xl p-4 hover:shadow-xs transition-all duration-200",
        href && "block group cursor-pointer hover:border-primary-bg",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="p-2 text-primary-bg rounded-full bg-primary-bg/10 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <span className="text-sm text-text-primary font-medium">
          {name}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-text-primary">
          {value}
        </div>
        {subtext && (
          <p className="text-[10px] text-text-muted group-hover:text-primary-bg transition-colors flex items-center gap-1 mt-0.5">
            {subtext} {href && <ArrowRight size={12} className="inline-block" />}
          </p>
        )}
      </div>
    </Component>
  );
}
