import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Users, 
  FileText, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  Play,
  Settings,
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MigrationStatus {
  phase: string;
  progress: number;
  error?: string;
  details: any;
  timestamp: string;
}

interface MigrationConfig {
  supabaseConfigured: boolean;
  environmentVariables: {
    SUPABASE_URL: boolean;
    SUPABASE_SERVICE_ROLE_KEY: boolean;
    DATABASE_URL: boolean;
  };
  requiredSteps: Array<{
    step: number;
    name: string;
    completed: boolean;
    description: string;
  }>;
}

export function MigrationDashboard() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Query migration status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/migration/status'],
    refetchInterval: 5000, // Poll every 5 seconds during migration
  });

  // Query migration readiness
  const { data: readinessData, isLoading: readinessLoading } = useQuery({
    queryKey: ['/api/migration/readiness'],
  });

  // Query migration configuration
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['/api/migration/config'],
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => fetch('/api/migration/test-connection').then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/readiness'] });
    },
  });

  // Start migration mutation
  const startMigrationMutation = useMutation({
    mutationFn: () => fetch('/api/migration/start', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
    },
  });

  // Individual step mutations
  const schemaStepMutation = useMutation({
    mutationFn: () => fetch('/api/migration/steps/schema', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
      setActiveStep(null);
    },
  });

  const usersStepMutation = useMutation({
    mutationFn: () => fetch('/api/migration/steps/users', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
      setActiveStep(null);
    },
  });

  const formsStepMutation = useMutation({
    mutationFn: () => fetch('/api/migration/steps/forms', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
      setActiveStep(null);
    },
  });

  const savedFormsStepMutation = useMutation({
    mutationFn: () => fetch('/api/migration/steps/saved-forms', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
      setActiveStep(null);
    },
  });

  const validateStepMutation = useMutation({
    mutationFn: () => fetch('/api/migration/steps/validate', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/migration/status'] });
      setActiveStep(null);
    },
  });

  const getStepMutation = (step: number) => {
    switch (step) {
      case 1: return schemaStepMutation;
      case 2: return usersStepMutation;
      case 3: return formsStepMutation;
      case 4: return savedFormsStepMutation;
      case 5: return validateStepMutation;
      default: return null;
    }
  };

  const handleStepExecution = (step: number) => {
    setActiveStep(step);
    const mutation = getStepMutation(step);
    if (mutation) {
      mutation.mutate();
    }
  };

  const isLoading = statusLoading || readinessLoading || configLoading;
  const migrationHistory: MigrationStatus[] = statusData?.migrationHistory || [];
  const currentPhase = statusData?.currentPhase || 'not_started';
  const isReady = readinessData?.ready || false;
  const config: MigrationConfig = configData?.config || {
    supabaseConfigured: false,
    environmentVariables: {
      SUPABASE_URL: false,
      SUPABASE_SERVICE_ROLE_KEY: false,
      DATABASE_URL: false
    },
    requiredSteps: []
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading migration dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Migration to Supabase</h1>
          <p className="text-muted-foreground mt-2">
            Migrate CentomoMD from PostgreSQL to Supabase with HIPAA compliance
          </p>
        </div>
        <Badge variant={isReady ? "default" : "destructive"}>
          {isReady ? "Ready for Migration" : "Setup Required"}
        </Badge>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration Status
          </CardTitle>
          <CardDescription>
            Verify all prerequisites are met before starting migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Variables */}
          <div>
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(config.environmentVariables).map(([key, configured]) => (
                <div key={key} className="flex items-center gap-2">
                  {configured ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">{key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Test */}
          <div className="flex items-center justify-between">
            <span>Supabase Connection</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>

          {/* Readiness Alert */}
          {readinessData && !isReady && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Migration Not Ready</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {readinessData.recommendations?.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Migration Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration Progress
          </CardTitle>
          <CardDescription>
            Current migration phase: {currentPhase.replace('_', ' ').toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Start Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => startMigrationMutation.mutate()}
              disabled={!isReady || startMigrationMutation.isPending}
              className="flex items-center gap-2"
            >
              {startMigrationMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start Full Migration
            </Button>
          </div>

          {/* Migration Steps */}
          <div className="space-y-3">
            <h4 className="font-medium">Migration Steps</h4>
            {config.requiredSteps.map((step) => {
              const isActive = activeStep === step.step;
              const mutation = getStepMutation(step.step);
              const isRunning = mutation?.isPending || false;

              return (
                <div key={step.step} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border">
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isRunning ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{step.step}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStepExecution(step.step)}
                    disabled={!isReady || isRunning || step.completed}
                  >
                    {isRunning ? (
                      "Running..."
                    ) : step.completed ? (
                      "Completed"
                    ) : (
                      "Run Step"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Migration History */}
      {migrationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Migration History
            </CardTitle>
            <CardDescription>
              Recent migration activities and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {migrationHistory.slice(-5).reverse().map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {status.error ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : status.progress === 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">{status.phase.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(status.timestamp).toLocaleString()}
                      </div>
                      {status.error && (
                        <div className="text-sm text-red-500 mt-1">{status.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{status.progress}%</div>
                    {status.progress > 0 && status.progress < 100 && (
                      <Progress value={status.progress} className="w-20 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HIPAA Compliance Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>HIPAA Compliance Notice</AlertTitle>
        <AlertDescription>
          This migration maintains full HIPAA compliance with encrypted data transfer, 
          comprehensive audit logging, and secure access controls. All patient data 
          will be protected throughout the migration process.
        </AlertDescription>
      </Alert>

      {/* SQL Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Manual Setup Required
          </CardTitle>
          <CardDescription>
            Some steps require manual execution in the Supabase dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>SQL Schema Setup</AlertTitle>
            <AlertDescription>
              After configuring environment variables, run the SQL script in 
              <code className="mx-1 px-1 bg-muted rounded">supabase-setup.sql</code> 
              in your Supabase SQL Editor to create the required tables and policies.
            </AlertDescription>
          </Alert>
          
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-2">Key Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Set up SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables</li>
              <li>Run the SQL setup script in Supabase SQL Editor</li>
              <li>Activate Supabase Pro plan for HIPAA compliance features</li>
              <li>Configure Business Associate Agreement (BAA) with Supabase</li>
              <li>Test connection and run migration steps</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}