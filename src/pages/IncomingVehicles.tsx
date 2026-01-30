import { Truck, Package, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function IncomingVehicles() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
            <Truck className="h-24 w-24 text-primary relative z-10 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Incoming Vehicles
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-md">
            Real-time tracking of vehicles en route. Monitor incoming shipments, expected arrival times, and transit status.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span className="text-sm">Track vehicles on the way</span>
            <Package className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
