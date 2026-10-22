import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type DashboardMetric = {
    label: string;
    value: string;
    percentage: string;
    isPositive?: boolean;
};

export type MainDashboardData = {
    title: string;
    description: string;
    metrics: DashboardMetric[];
};

export type WidgetProps = {
    mainDashboard?: MainDashboardData;
    className?: string;
};

const defaultLmsAnalyticsData: MainDashboardData = {
    title: "Learning Performance & Metrics",
    description: "Real-time engagement across active cohorts and learning tracks",
    metrics: [
        {
            label: "Active Learners",
            value: "480",
            percentage: "+16%",
            isPositive: true,
        },
        {
            label: "Completion Rate",
            value: "84.2%",
            percentage: "+4%",
            isPositive: true,
        },
    ],
};

const AnalyticsCard = ({
    mainDashboard = defaultLmsAnalyticsData,
    className,
}: WidgetProps) => {
    return (
        <div className={cn("w-full", className)}>
            <Card className="p-0 ring-0 border border-border rounded-xl relative h-full w-full bg-card shadow-xs overflow-hidden">
                <CardContent className="p-0">
                    <div className="ps-6 py-6 pe-4 sm:pe-36 flex flex-col gap-8 justify-between relative z-10">
                        <div>
                            <p className="text-lg font-bold text-foreground tracking-tight">
                                {mainDashboard.title}
                            </p>
                            <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                {mainDashboard.description}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            {mainDashboard.metrics.map((metric, index) => (
                                <div key={index} className="flex items-center gap-6">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {metric.label}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-2xl font-bold text-foreground tracking-tight">
                                                {metric.value}
                                            </p>
                                            <Badge
                                                className={cn(
                                                    "font-semibold text-[11px] border-0 px-2 py-0.5",
                                                    metric.isPositive
                                                        ? "bg-emerald-500/10 text-emerald-700"
                                                        : "bg-rose-500/10 text-rose-700"
                                                )}
                                            >
                                                {metric.percentage}
                                            </Badge>
                                        </div>
                                    </div>
                                    {index < mainDashboard.metrics.length - 1 && (
                                        <Separator
                                            orientation="vertical"
                                            className="h-10 hidden sm:block"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Background artwork */}
                    <img
                        src="https://images.shadcnspace.com/assets/backgrounds/stats-01.webp"
                        alt="stats illustration"
                        width={211}
                        height={168}
                        className="absolute bottom-0 right-0 hidden md:block pointer-events-none opacity-90"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsCard;
export { AnalyticsCard };
