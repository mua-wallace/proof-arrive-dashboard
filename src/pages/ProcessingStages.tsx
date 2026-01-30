import { Package, Layers, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ProcessingStages() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
            <Package className="h-24 w-24 text-primary relative z-10 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Processing Stages
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-md">
            Monitor vehicle processing workflows. Track each stage from arrival to completion with detailed status updates.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-5 w-5" />
            <span className="text-sm">Workflow management coming soon</span>
            <Settings className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
