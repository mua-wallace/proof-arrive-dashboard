import { ArrowRightLeft, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Arrivals() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
            <ArrowRightLeft className="h-24 w-24 text-primary relative z-10 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Arrivals Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-md">
            Track and monitor vehicle arrivals in real-time. Get instant notifications and detailed arrival logs.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Stay tuned for updates</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
